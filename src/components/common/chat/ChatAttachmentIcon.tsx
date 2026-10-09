
"use client";

import ContentTypeIcon from "@/components/common/contenido/ContentTypeIcon";

type Props = {
  filename: string;
  className?: string;
};

export default function ChatAttachmentIcon({
  filename,
  className = "h-7 w-7",
}: Props) {
  const nombre = filename
    .split(/[?#]/, 1)[0]
    .toLowerCase();

  // PDF
  if (/\.pdf$/.test(nombre)) {
    return (
      <ContentTypeIcon
        type="pdf"
        className={className}
      />
    );
  }

  // Word: DOC, DOCX, ODT y RTF
  if (/\.(doc|docx|odt|rtf)$/.test(nombre)) {
    return (
      <ContentTypeIcon
        type="word"
        className={className}
      />
    );
  }

  // PowerPoint
  if (
    /\.(ppt|pptx|pptm|pps|ppsx|odp)$/.test(nombre)
  ) {
    return (
      <ContentTypeIcon
        type="ppt"
        className={className}
      />
    );
  }

  // Vídeo
  if (
    /\.(mp4|mov|m4v|webm|avi|mkv|mpeg|mpg|3gp)$/.test(
      nombre
    )
  ) {
    return (
      <ContentTypeIcon
        type="video"
        className={className}
      />
    );
  }

  // Imágenes
  if (
    /\.(png|jpe?g|gif|webp|bmp|svg|avif|tiff?|heic|heif)$/.test(
      nombre
    )
  ) {
    return (
      <ContentTypeIcon
        type="image"
        className={className}
      />
    );
  }

    // Archivo genérico: Excel, ZIP, TXT y otros formatos
    return (
      <ContentTypeIcon
        type="file"
        className={className}
      />
    );
}
