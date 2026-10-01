"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { renderAsync } from "docx-preview";

import ViewerToolbar from "./ViewerToolbar";

type DocxViewerProps = {
  title: string;
  file: string;
};

export default function DocxViewer({
  title,
  file,
}: DocxViewerProps) {
  const rootRef =
    useRef<HTMLDivElement>(null);

  const bodyRef =
    useRef<HTMLDivElement>(null);

  const styleRef =
    useRef<HTMLDivElement>(null);

  const pagesRef =
    useRef<HTMLElement[]>([]);

  const observerRef =
    useRef<IntersectionObserver | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [zoom, setZoom] =
    useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      if (
        !bodyRef.current ||
        !styleRef.current
      ) {
        return;
      }

      observerRef.current?.disconnect();

      bodyRef.current.innerHTML = "";
      styleRef.current.innerHTML = "";

      pagesRef.current = [];

      setLoading(true);
      setError(false);
      setCurrentPage(1);
      setTotalPages(1);

      try {
        const response =
          await fetch(file);

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar ${file}`
          );
        }

        const buffer =
          await response.arrayBuffer();

        if (cancelled) {
          return;
        }

        await renderAsync(
          buffer,
          bodyRef.current,
          styleRef.current,
          {
            breakPages: true,
            ignoreLastRenderedPageBreak:
              false,
          }
        );

        if (
          cancelled ||
          !bodyRef.current
        ) {
          return;
        }

        /*
         * docx-preview normalmente
         * genera cada página como <section class="docx">.
         */
        const pages =
          Array.from(
            bodyRef.current.querySelectorAll<HTMLElement>(
              "section.docx"
            )
          );

        pagesRef.current =
          pages;

        setTotalPages(
          Math.max(
            pages.length,
            1
          )
        );

        setCurrentPage(1);

        observerRef.current =
          new IntersectionObserver(
            (entries) => {
              const visiblePage =
                entries
                  .filter(
                    (entry) =>
                      entry.isIntersecting
                  )
                  .sort(
                    (a, b) =>
                      b.intersectionRatio -
                      a.intersectionRatio
                  )[0];

              if (visiblePage) {
                const index =
                  pages.indexOf(
                    visiblePage.target as HTMLElement
                  );

                if (index >= 0) {
                  setCurrentPage(
                    index + 1
                  );
                }
              }
            },
            {
              root:
                rootRef.current,
              threshold: [
                0.5,
                0.75,
                1,
              ],
            }
          );

        pages.forEach((page) =>
          observerRef.current?.observe(
            page
          )
        );
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;

      observerRef.current?.disconnect();

      if (bodyRef.current) {
        bodyRef.current.innerHTML =
          "";
      }

      if (styleRef.current) {
        styleRef.current.innerHTML =
          "";
      }
    };
  }, [file]);

  const increaseZoom = () => {
    setZoom((value) =>
      Math.min(
        Number((value + 0.1).toFixed(1)),
        2
      )
    );
  };

  const decreaseZoom = () => {
    setZoom((value) =>
      Math.max(
        Number((value - 0.1).toFixed(1)),
        0.5
      )
    );
  };

  const goToPage = (page: number) => {
    const target =
      pagesRef.current[page - 1];

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setCurrentPage(page);
  };

  return (
    <div className="w-full">

      <ViewerToolbar
        title={title}
        type="word"
        file={file}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        onPreviousPage={() =>
          goToPage(
            Math.max(
              currentPage - 1,
              1
            )
          )
        }
        onNextPage={() =>
          goToPage(
            Math.min(
              currentPage + 1,
              totalPages
            )
          )
        }
        onZoomOut={decreaseZoom}
        onZoomIn={increaseZoom}
      />

      <div
        ref={rootRef}
        className="h-[560px] overflow-auto bg-[#666666] p-7"
      >

        {loading && (
          <div className="flex h-[450px] items-center justify-center text-white">
            Cargando documento...
          </div>
        )}

        {error && (
          <div className="flex h-[450px] items-center justify-center text-white">
            No se pudo cargar el documento Word.
          </div>
        )}

        <div
          ref={styleRef}
        />

        <div
          ref={bodyRef}
          className="mx-auto w-fit"
          style={{
            zoom,
          }}
        />

      </div>
    </div>
  );
}