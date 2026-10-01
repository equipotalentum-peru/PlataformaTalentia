"use client";

import type { Announcement } from "@/data/announcements";

type AnnouncementModalProps = {
  announcement: Announcement | null;
  onClose: () => void;
};

export default function AnnouncementModal({
  announcement,
  onClose,
}: AnnouncementModalProps) {
  if (!announcement) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[650px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
              <svg
                className="h-6 w-6 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 10v4h3l7 4V6l-7 4H4Z" />
                <path d="M17 9c1.5 1.7 1.5 4 0 6" />
              </svg>
            </div>

            <div>
              <h2 className="text-[16px] font-bold text-gray-900">
                {announcement.title}
              </h2>

              <p className="mt-1 text-[10px] text-gray-400">
                {announcement.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[24px] leading-none text-gray-500 hover:text-black"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-gray-700">
            {announcement.content}
          </p>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#3186d8] px-5 py-2 text-[11px] font-medium text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}