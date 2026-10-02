"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { courseContents, courseModules } from "@/data/courseContents";
import { getViewedContentIds, markContentViewed } from "@/lib/progress";
import CourseContentIcon from "@/components/common/contenido/CourseContentIcon";

const MODULE_COLOR = "#70A9DC";

type CourseModulesProps = {
  courseId: number;
};

export default function CourseModules({ courseId }: CourseModulesProps) {
  /*
   * IDs de contenidos que el alumno ya visitó.
   */
  const [viewedContentIds, setViewedContentIds] = useState<Set<number>>(
    new Set()
  );

  const [openModules, setOpenModules] = useState<number[]>([1]);

  /*
   * ======================================================
   * CARGAR PROGRESO
   * ======================================================
   */

  useEffect(() => {
    const loadProgress = () => {
      setViewedContentIds(getViewedContentIds(courseId));
    };

    loadProgress();

    window.addEventListener("talentia-progress-updated", loadProgress);

    return () => {
      window.removeEventListener("talentia-progress-updated", loadProgress);
    };
  }, [courseId]);

  /*
   * ======================================================
   * ABRIR / CERRAR MÓDULO
   * ======================================================
   */

  const toggleModule = (moduleId: number) => {
    setOpenModules((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId]
    );
  };

  /*
   * ======================================================
   * MÓDULOS
   * ======================================================
   */

  const modulesWithProgress = useMemo(() => {
    return courseModules.map((module) => {
      const contents = courseContents.filter(
        (content) =>
          content.courseId === courseId && content.moduleId === module.id
      );

      const viewedCount = contents.filter((content) =>
        viewedContentIds.has(content.id)
      ).length;

      const total = contents.length;

      const progress = total > 0 ? (viewedCount / total) * 100 : 0;

      return {
        ...module,
        contents,
        viewedCount,
        total,
        progress,
      };
    });
  }, [courseId, viewedContentIds]);

  return (
    <div className="space-y-2">
      {modulesWithProgress.map((module) => {
        const isOpen = openModules.includes(module.id);

        const fullyCompleted =
          module.total > 0 && module.viewedCount === module.total;

        return (
          <div key={module.id} className="overflow-hidden rounded-lg">
            {/* ==========================================
                CABECERA DEL MÓDULO
               ========================================== */}

            <button
              type="button"
              onClick={() => toggleModule(module.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:brightness-95"
              style={{
                backgroundColor: MODULE_COLOR,
              }}
            >
              {/* PROGRESO DEL MÓDULO */}
              <div className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-white">
                {fullyCompleted && (
                  <svg
                    className="h-[11px] w-[11px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={MODULE_COLOR}
                    strokeWidth="4"
                  >
                    <path d="M5 12l4 4L19 6" />
                  </svg>
                )}
              </div>

              {/* TÍTULO */}
              <span className="flex-1 text-[14px] font-semibold text-[#12395B]">
                Módulo {module.id}: {module.title}
              </span>

              {/* FLECHA */}
              <svg
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* ==========================================
                CONTENIDOS DEL MÓDULO
               ========================================== */}

            {isOpen && (
              <div className="bg-white">
                {module.contents.map((content) => {
                  const isViewed = viewedContentIds.has(content.id);

                  // 1. Casteo seguro a string para evitar restricciones de tipos
                  const contentType = (content.type as string).toLowerCase();

                  // 2. Búsqueda limpia de la URL externa
                  const item = content as Record<string, unknown>;
                  const externalUrl = (item.url ||
                    item.link ||
                    item.fileUrl ||
                    item.src) as string | undefined;

                  // 3. Validación de enlace externo
                  const isExternalLink =
                    contentType === "link" ||
                    contentType === "url" ||
                    contentType === "enlace" ||
                    Boolean(
                      externalUrl &&
                        (externalUrl.startsWith("http://") ||
                          externalUrl.startsWith("https://"))
                    );

                  const handleClick = () => {
                    if (
                      content.type !== "quiz" &&
                      content.type !== "activity"
                    ) {
                      markContentViewed(courseId, content.id);
                    }
                  };

                  const commonClasses =
                    "group flex items-center gap-3 border-b border-gray-100 px-5 py-2.5 transition hover:bg-[#f7f9fc]";

                  const contentInnerHtml = (
                    <>
                      {/* ICONO DEL CONTENIDO */}
                      <span className="flex w-6 shrink-0 items-center justify-center text-black">
                        <CourseContentIcon
                          type={content.type}
                          className="h-5 w-5"
                        />
                      </span>

                      {/* NOMBRE */}
                      <span className="flex-1 text-[13px] text-gray-800">
                        {module.id}.{content.order} {content.title}
                      </span>

                      {/* ESTADO DEL CONTENIDO */}
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white"
                        style={{
                          borderColor: MODULE_COLOR,
                          backgroundColor: isViewed
                            ? MODULE_COLOR
                            : "#ffffff",
                        }}
                      >
                        {isViewed && (
                          <svg
                            className="h-2.5 w-2.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path d="M5 12l4 4L19 6" />
                          </svg>
                        )}
                      </span>
                    </>
                  );

                  // 4. Si es enlace externo y tiene una URL, renderiza etiqueta <a>
                  if (isExternalLink && externalUrl) {
                    return (
                      <a
                        key={content.id}
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                        className={commonClasses}
                      >
                        {contentInnerHtml}
                      </a>
                    );
                  }

                  // 5. Si es vista interna de la plataforma, usa Next Link
                  return (
                    <Link
                      key={content.id}
                      href={`/alumno/cursos/${courseId}/contenido/${content.id}`}
                      onClick={handleClick}
                      className={commonClasses}
                    >
                      {contentInnerHtml}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
