"use client";

import ContentTypeIcon from "@/components/common/contenido/ContentTypeIcon";

type Props = {
  filename?: string | null;
  className?: string;
};

/**
 * Devuelve el icono SVG según la extensión del archivo.
 * Se usa en el chat, en las actividades y en las evaluaciones
 * para que todos los archivos se vean igual.
 */
export default function FileTypeIcon({
  filename,
  className = "h-7 w-7",
}: Props) {
  const nombre = (filename || "")
    .split(/[?#]/, 1)[0]
    .toLowerCase();

  let type: "pdf" | "word" | "ppt" | "video" | "image" | "file" = "file";

  if (/\.pdf$/.test(nombre)) type = "pdf";
  else if (/\.(doc|docx|dot|dotx|odt|rtf)$/.test(nombre)) type = "word";
  else if (/\.(ppt|pptx|pptm|pps|ppsx|odp)$/.test(nombre)) type = "ppt";
  else if (/\.(mp4|mov|m4v|webm|avi|mkv|mpeg|mpg|3gp)$/.test(nombre)) type = "video";
  else if (/\.(png|jpe?g|gif|webp|bmp|svg|avif|tiff?|heic|heif)$/.test(nombre)) type = "image";

  return <ContentTypeIcon type={type} className={className} />;
}
