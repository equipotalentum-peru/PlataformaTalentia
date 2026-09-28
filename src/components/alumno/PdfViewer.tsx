"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import ViewerToolbar from "./ViewerToolbar";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfViewerProps = {
  title: string;
  file: string;
};

export default function PdfViewer({
  title,
  file,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(
      (entries) => {
        const width =
          entries[0]?.contentRect.width;

        if (width) {
          setContainerWidth(width);
        }
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = containerRef.current;

    if (!root || numPages === 0) {
      return;
    }

    const pageElements =
      root.querySelectorAll<HTMLElement>(
        "[data-pdf-page]"
      );

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visiblePage = entries
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
            const page = Number(
              visiblePage.target.getAttribute(
                "data-page"
              )
            );

            if (page) {
              setCurrentPage(page);
            }
          }
        },
        {
          root,
          threshold: [0.5, 0.75, 1],
        }
      );

    pageElements.forEach(
      (element) =>
        observer.observe(element)
    );

    return () =>
      observer.disconnect();
  }, [numPages, zoom]);

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
    const root =
      containerRef.current;

    if (!root) {
      return;
    }

    const target =
      root.querySelector<HTMLElement>(
        `[data-page="${page}"]`
      );

    target?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setCurrentPage(page);
  };

  const pageWidth = Math.max(
    Math.min(
      containerWidth - 30,
      900
    ) * zoom,
    300
  );

  return (
    <div className="w-full">

      <ViewerToolbar
        title={title}
        type="pdf"
        file={file}
        currentPage={currentPage}
        totalPages={numPages}
        zoom={zoom}
        onPreviousPage={() =>
          goToPage(
            Math.max(currentPage - 1, 1)
          )
        }
        onNextPage={() =>
          goToPage(
            Math.min(
              currentPage + 1,
              numPages
            )
          )
        }
        onZoomOut={decreaseZoom}
        onZoomIn={increaseZoom}
      />

      <div
        ref={containerRef}
        className="h-[560px] overflow-y-auto bg-[#666666] p-4"
      >
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setCurrentPage(1);
          }}
          loading={
            <div className="flex h-[500px] items-center justify-center text-white">
              Cargando PDF...
            </div>
          }
          error={
            <div className="flex h-[500px] items-center justify-center text-white">
              No se pudo cargar el PDF.
            </div>
          }
        >
          {Array.from(
            { length: numPages },
            (_, index) => {
              const pageNumber =
                index + 1;

              return (
                <div
                  key={pageNumber}
                  data-pdf-page
                  data-page={pageNumber}
                  className="mb-4 flex justify-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
              );
            }
          )}
        </Document>
      </div>
    </div>
  );
}