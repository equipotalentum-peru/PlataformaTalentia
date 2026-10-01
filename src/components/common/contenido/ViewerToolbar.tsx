import type { ContentType } from "@/data/courseContents";
import ContentTypeIcon from "./ContentTypeIcon";

type ViewerToolbarProps = {
  title: string;
  type: Extract<ContentType, "pdf" | "video" | "ppt" | "word">;
  file: string;

  currentPage?: number;
  totalPages?: number;

  zoom?: number;

  onPreviousPage?: () => void;
  onNextPage?: () => void;

  onZoomOut?: () => void;
  onZoomIn?: () => void;
};

export default function ViewerToolbar({
  title,
  type,
  file,
  currentPage,
  totalPages,
  zoom = 1,
  onPreviousPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
}: ViewerToolbarProps) {
  const hasDocumentControls =
    type !== "video" &&
    currentPage !== undefined &&
    totalPages !== undefined;

  return (
    <div
      className="
        grid min-h-[60px]
        grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
        items-center gap-4
        bg-black px-4 text-white
      "
    >
      {/* IZQUIERDA */}
      <div className="flex min-w-0 items-center gap-3 justify-self-start">
        <ContentTypeIcon
          type={type}
          className="h-9 w-9 shrink-0"
        />

        <span className="truncate text-sm font-semibold">
          {title}
        </span>
      </div>

      {/* CENTRO */}
      {hasDocumentControls ? (
        <div
          className="
            flex items-center gap-1
            rounded-xl border border-white/10
            bg-[#181818] p-1
            shadow-[0_4px_18px_rgba(0,0,0,0.35)]
          "
        >
          {/* Página anterior */}
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={!onPreviousPage || currentPage <= 1}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg
              text-lg font-semibold
              transition
              hover:bg-white/10
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
            aria-label="Página anterior"
          >
            ‹
          </button>

          {/* Página */}
          <div
            className="
              min-w-[82px]
              rounded-lg
              bg-[#292929]
              px-3 py-1.5
              text-center
              text-sm font-bold
              tabular-nums
            "
          >
            {currentPage} / {totalPages}
          </div>

          {/* Página siguiente */}
          <button
            type="button"
            onClick={onNextPage}
            disabled={
              !onNextPage ||
              currentPage >= totalPages
            }
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg
              text-lg font-semibold
              transition
              hover:bg-white/10
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
            aria-label="Página siguiente"
          >
            ›
          </button>

          <div className="mx-1 h-7 w-px bg-white/10" />

          {/* Zoom - */}
          <button
            type="button"
            onClick={onZoomOut}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg
              text-xl font-semibold
              transition
              hover:bg-white/10
            "
            aria-label="Reducir zoom"
          >
            −
          </button>

          {/* Zoom */}
          <div
            className="
              min-w-[62px]
              rounded-lg
              bg-[#292929]
              px-3 py-1.5
              text-center
              text-sm font-bold
              tabular-nums
            "
          >
            {Math.round(zoom * 100)}%
          </div>

          {/* Zoom + */}
          <button
            type="button"
            onClick={onZoomIn}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg
              text-xl font-semibold
              transition
              hover:bg-white/10
            "
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
      ) : (
        <div />
      )}

      <div className="group relative justify-self-end">
        <a
          href={file}
          download
          aria-label="Descargar archivo"
          title="Descargar archivo"
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-full
            border border-white/15
            bg-white
            text-[#202020]
            shadow-[0_4px_14px_rgba(0,0,0,0.25)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:scale-105
            hover:bg-[#f3f6f8]
            active:scale-95
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </a>

        <span
          className="
            pointer-events-none
            absolute right-0 top-full z-50 mt-2
            whitespace-nowrap
            rounded-md
            bg-black px-2.5 py-1.5
            text-[11px] font-medium text-white
            opacity-0
            shadow-lg
            transition-opacity
            group-hover:opacity-100
          "
        >
          Descargar archivo
        </span>
        
      </div>

    </div>
  );
}