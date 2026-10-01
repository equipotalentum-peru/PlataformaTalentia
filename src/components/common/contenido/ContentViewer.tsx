"use client";

import dynamic from "next/dynamic";
import type { ContentType } from "@/data/courseContents";

import ContentTypeIcon from "./ContentTypeIcon";

const PdfViewer = dynamic(
  () => import("./PdfViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-[#666666] text-white">
        Cargando visor PDF...
      </div>
    ),
  }
);

const PptViewer = dynamic(
  () => import("./PptViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-[#666666] text-white">
        Cargando presentación...
      </div>
    ),
  }
);

const DocxViewer = dynamic(
  () => import("./DocxViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-[#666666] text-white">
        Cargando documento...
      </div>
    ),
  }
);

type ContentViewerProps = {
  title: string;
  type: ContentType;
  file?: string;
};

export default function ContentViewer({
  title,
  type,
  file,
}: ContentViewerProps) {
  if (!file) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#666666] text-white">
        Este contenido no tiene un archivo asociado.
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <PdfViewer
        title={title}
        file={file}
      />
    );
  }

  if (type === "ppt") {
    return (
      <PptViewer
        title={title}
        file={file}
      />
    );
  }

  if (type === "word") {
    return (
      <DocxViewer
        title={title}
        file={file}
      />
    );
  }

  if (type === "video") {
    return (
      <div className="w-full">

        <div className="grid min-h-[60px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 bg-black px-4 text-white">

          <div className="flex min-w-0 items-center gap-3">
            <ContentTypeIcon
              type="video"
              className="h-9 w-9 shrink-0 text-white"
            />

            <span className="truncate text-sm font-semibold">
              {title}
            </span>
          </div>

          <div />

          <a
            href={file}
            download
            className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full bg-white text-black shadow-md transition hover:scale-105"
            title="Descargar video"
          >
            ↓
          </a>

        </div>

        <div className="bg-[#666666] p-7">
          <video
            controls
            className="mx-auto max-h-[560px] w-full max-w-[900px] bg-black"
          >
            <source src={file} />
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>

      </div>
    );
  }

  return (
    <div className="flex min-h-[500px] items-center justify-center bg-[#666666] text-white">
      No hay un visor disponible para este contenido.
    </div>
  );
}