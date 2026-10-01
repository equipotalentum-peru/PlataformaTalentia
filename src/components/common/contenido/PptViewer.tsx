"use client";
import { useEffect, useMemo, useRef, useState, } from "react";
import { parse, renderSlideToSvg, } from "@web-ppt/core";
import ViewerToolbar from "./ViewerToolbar";

type PptViewerProps = {
  title: string;
  file: string;
};

type Presentation = Awaited<
  ReturnType<typeof parse>
>;

type RenderSlideFunction = (
  presentation: Presentation,
  slide: Presentation["slides"][number],
  options?: {
    idPrefix?: string;
  }
) => string;

/*
 * La versión de @web-ppt/core que tienes instalada
 * no está exponiendo idPrefix correctamente en sus
 * declaraciones TypeScript, aunque la API actual
 * sí lo admite.
 */
const renderSlide =
  renderSlideToSvg as unknown as RenderSlideFunction;

export default function PptViewer({
  title,
  file,
}: PptViewerProps) {
  const viewerRef =
    useRef<HTMLDivElement>(null);

  const slideRefs =
    useRef<(HTMLDivElement | null)[]>(
      []
    );

  const observerRef =
    useRef<IntersectionObserver | null>(
      null
    );

  const [presentation, setPresentation] =
    useState<Presentation | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [zoom, setZoom] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // =========================================================
  // CARGAR PPTX
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadPresentation() {
      setLoading(true);
      setError(null);
      setPresentation(null);
      setCurrentPage(1);

      try {
        const response =
          await fetch(file, {
            cache: "no-store",
          });

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar el PPTX. Estado HTTP: ${response.status}`
          );
        }

        const buffer =
          await response.arrayBuffer();

        if (cancelled) {
          return;
        }

        const parsed =
          await parse(buffer);

        if (
          cancelled ||
          !parsed.slides ||
          parsed.slides.length === 0
        ) {
          throw new Error(
            "La presentación no contiene diapositivas."
          );
        }

        setPresentation(parsed);
      } catch (err) {
        console.error(
          "Error cargando PPTX:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la presentación."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPresentation();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const totalPages =
    presentation?.slides.length ?? 0;

  // =========================================================
  // RENDERIZAR TODAS LAS DIAPOSITIVAS
  // =========================================================

  const slides = useMemo(() => {
    if (!presentation) {
      return [];
    }

    return presentation.slides.map(
      (slide, index) => {
        try {
          return {
            index,
            svg: renderSlide(
              presentation,
              slide,
              {
                idPrefix:
                  `talentia-ppt-${index + 1}-`,
              }
            ),
          };
        } catch (err) {
          console.error(
            `Error renderizando diapositiva ${index + 1}:`,
            err
          );

          return {
            index,
            svg: "",
          };
        }
      }
    );
  }, [presentation]);

  // =========================================================
  // DETECTAR QUÉ DIAPOSITIVA ESTÁ VISIBLE
  // =========================================================

  useEffect(() => {
    const root =
      viewerRef.current;

    if (
      !root ||
      slides.length === 0
    ) {
      return;
    }

    observerRef.current?.disconnect();

    observerRef.current =
      new IntersectionObserver(
        (entries) => {
          const visible =
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

          if (!visible) {
            return;
          }

          const index =
            Number(
              (
                visible.target as HTMLElement
              ).dataset.slide
            );

          if (!Number.isNaN(index)) {
            setCurrentPage(index);
          }
        },
        {
          root,
          threshold: [0.45, 0.6, 0.8],
        }
      );

    slideRefs.current.forEach(
      (element) => {
        if (element) {
          observerRef.current?.observe(
            element
          );
        }
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [slides]);

  // =========================================================
  // CAMBIAR DIAPOSITIVA
  // =========================================================

  const goToPage = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    const target =
      slideRefs.current[
        page - 1
      ];

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setCurrentPage(page);
  };

  // =========================================================
  // ZOOM
  // =========================================================

  const increaseZoom = () => {
    setZoom((value) =>
      Math.min(
        Number(
          (value + 0.1).toFixed(1)
        ),
        2
      )
    );
  };

  const decreaseZoom = () => {
    setZoom((value) =>
      Math.max(
        Number(
          (value - 0.1).toFixed(1)
        ),
        0.5
      )
    );
  };

  return (
    <div className="w-full">

      {/* TOOLBAR */}
      <ViewerToolbar
        title={title}
        type="ppt"
        file={file}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        onPreviousPage={() =>
          goToPage(
            currentPage - 1
          )
        }
        onNextPage={() =>
          goToPage(
            currentPage + 1
          )
        }
        onZoomOut={
          decreaseZoom
        }
        onZoomIn={
          increaseZoom
        }
      />

      {/* VISOR */}
      <div
        ref={viewerRef}
        className="
          h-[560px]
          overflow-auto
          bg-[#666666]
          p-7
        "
      >

        {/* CARGANDO */}
        {loading && (
          <div
            className="
              flex
              min-h-[500px]
              items-center
              justify-center
              text-white
            "
          >
            Cargando presentación...
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div
            className="
              flex
              min-h-[500px]
              items-center
              justify-center
              px-8
              text-center
              text-white
            "
          >
            <div>
              <p className="mb-2 text-lg font-semibold">
                No se pudo cargar la presentación
              </p>

              <p className="text-sm text-gray-200">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* TODAS LAS DIAPOSITIVAS */}
        {!loading &&
          !error &&
          presentation && (
            <div className="mx-auto flex w-full flex-col items-center gap-6">

              {slides.map(
                (slide) => {
                  const baseWidth = 960;

                  const baseHeight =
                    baseWidth *
                    (presentation.height /
                      presentation.width);

                  return (
                    <div
                      key={slide.index}
                      ref={(element) => {
                        slideRefs.current[
                          slide.index
                        ] = element;
                      }}
                      data-slide={
                        slide.index + 1
                      }
                      className="
                        shrink-0
                        rounded-sm
                        bg-white
                        shadow-lg
                      "
                      style={{
                        width:
                          baseWidth * zoom,
                        height:
                          baseHeight * zoom,
                      }}
                    >

                      <div
                        className="
                          origin-top-left
                        "
                        style={{
                          width:
                            baseWidth,
                          height:
                            baseHeight,
                          transform:
                            `scale(${zoom})`,
                        }}
                      >
                        {slide.svg ? (
                          <div
                            className="
                              h-full
                              w-full
                              [&>svg]:block
                              [&>svg]:h-auto
                              [&>svg]:w-full
                            "
                            dangerouslySetInnerHTML={{
                              __html:
                                slide.svg,
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-gray-500">
                            No se pudo renderizar esta diapositiva.
                          </div>
                        )}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

      </div>
    </div>
  );
}