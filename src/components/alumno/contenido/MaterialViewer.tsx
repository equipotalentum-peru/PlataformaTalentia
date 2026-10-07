"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import ContentViewer from "@/components/common/contenido/ContentViewer";
import SectionNavigation from "@/components/alumno/SectionNavigation";
import ActivityViewer from "./ActivityViewer";
import { activities, type ActivityDefinition } from "@/data/activities";
import { markContentViewed, } from "@/lib/progress";

type Contenido = {
  id: string | number;
  titulo: string;
  tipo: string;
  rutaArchivo: string | null;
  descripcion: string | null;
};

type Props = {
  courseId: number;
  contentId: number;
};

export default function MaterialViewer({ courseId, contentId }: Props) {
  const [material, setMaterial] = useState<{
    titulo: string;
    tipo: "pdf" | "ppt" | "word" | "video" | "activity";

    archivo: string;
    previousHref?: string;
    nextHref?: string;
    actividad?: ActivityDefinition;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let archivo = "";

    async function cargar() {
      try {
        const opciones = {
          credentials: "include" as const,
          signal: controller.signal,
        };
        const response = await fetch(
          `${API_URL}/cursos/${courseId}/modulos`, opciones
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const contenidos: Contenido[] = data.modulos.flatMap(
          (modulo: { contenidos: Contenido[] }) => modulo.contenidos
        );
        const materiales = contenidos.filter(
            (item) =>
              (
                [
                  "pdf",
                  "docx",
                  "pptx",
                  "video",
                ].includes(
                  item.tipo
                )
              ) ||
              item.tipo ===
                "actividad" ||
              item.tipo ===
                "evaluacion"
          );

        const indice = materiales.findIndex(
          (item) => Number(item.id) === contentId
        );
        const contenido = materiales.find(
          (item) => Number(item.id) === contentId
        );
        if (!contenido) {
          throw new Error("Material no disponible.");
        }
        /*
        * Los materiales normales se consideran
        * vistos al abrirlos.
        *
        * Actividades y evaluaciones tienen
        * reglas propias.
        */
        if (
          contenido.tipo !==
            "actividad" &&
          contenido.tipo !==
            "evaluacion"
        ) {
          markContentViewed(
            courseId,
            contentId
          );
        }
        const navegacion = {
          previousHref: indice > 0
            ? `/alumno/cursos/${courseId}/contenido/${materiales[indice - 1].id}?material=1`
            : undefined,
          nextHref: indice < materiales.length - 1
            ? `/alumno/cursos/${courseId}/contenido/${materiales[indice + 1].id}?material=1`
            : undefined,
        };
        if (contenido.tipo === "actividad") {
          if (controller.signal.aborted) return;
          const plantilla = activities.find((item) => item.id === 6);
          if (!plantilla) throw new Error("Plantilla de actividad no disponible.");
          setMaterial({
            titulo: contenido.titulo,
            tipo: "activity",
            archivo: "",
            ...navegacion,
            actividad: {
              ...plantilla,
              id: contentId,
              title: contenido.titulo,
              description: contenido.descripcion ?? "Consigna pendiente de definir.",
              dueDate: "Por definir",
              dueTime: "",
              rubricAvailable: false,
              submissions: [],
            },
          });
          return;
        }
        if (!contenido.rutaArchivo) {
          if (controller.signal.aborted) return;
          setMaterial({
            titulo: contenido.titulo,
            tipo: contenido.tipo === "docx" ? "word" : contenido.tipo === "video" ? "video" : contenido.tipo === "pdf" ? "pdf" : "ppt",
            archivo: "",
            ...navegacion,
          });
          return;
        }
        const fichero = await fetch(
          `${API_URL}/cursos/${courseId}/contenidos/${contentId}/archivo`,
          opciones
        );
        if (!fichero.ok) throw new Error("No se pudo cargar el archivo.");
        const blob = await fichero.blob();
        if (controller.signal.aborted) return;
        archivo = URL.createObjectURL(blob);
        const tipoMaterial =
          contenido.tipo === "pdf"
            ? "pdf"
            : contenido.tipo === "docx"
              ? "word"
              : contenido.tipo === "video"
                ? "video"
                : "ppt";

        setMaterial({
          titulo:
            contenido.titulo,
          tipo: tipoMaterial,

          archivo,
          ...navegacion,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Error al cargar.");
        }
      }
    }
    void cargar();
    return () => {
      controller.abort();
      if (archivo) URL.revokeObjectURL(archivo);
    };
  }, [courseId, contentId]);

  if (error) return <p role="alert">{error}</p>;
  if (!material) return <p>Cargando material...</p>;
  return (
    <>
      {material.tipo === "activity" ? (
          <ActivityViewer
            activityId={contentId}
            courseId={courseId}
            activityDefinition={material.actividad}
            previousHref={material.previousHref}
            nextHref={material.nextHref}
            exitHref={`/alumno/cursos/${courseId}`}
            trackLocalProgress={true}
          />
      ) : (
        <ContentViewer
          title={material.titulo}
          type={material.tipo}
          file={material.archivo}
        />
      )}
      <SectionNavigation
        courseId={courseId}
        currentContentId={contentId}
        currentContentType={material.tipo}
        previousHref={material.previousHref}
        nextHref={material.nextHref}
        trackLocalProgress={false}
      />
    </>
  );
}
