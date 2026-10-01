import type { ReactNode } from "react";
import type { Announcement } from "@/data/announcements";

type AnnouncementCardProps = {
  announcement: Announcement;
  action?: ReactNode;
  meta?: ReactNode;
  unread?: boolean;
};

export default function AnnouncementCard({
  announcement,
  action,
  meta,
  unread = false,
}: AnnouncementCardProps) {
  return (
    <article
      className={`rounded-lg bg-white px-5 py-3 shadow-sm ${
        unread ? "border-l-4 border-[#3186d8]" : ""
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex min-w-0 items-center gap-4">

          {/* ICONO */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
            <svg
              className="h-7 w-7 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 10v4h3l7 4V6l-7 4H4Z" />
              <path d="M17 9c1.5 1.7 1.5 4 0 6" />
              <path d="M19.5 6.5c3.5 3.2 3.5 7.8 0 11" />
            </svg>
          </div>

          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-gray-900">
              {announcement.title}
            </h3>

            <p className="mt-0.5 text-[10px] text-gray-400">
              {announcement.date}
            </p>

            <p className="mt-1 line-clamp-2 max-w-[650px] text-[11px] leading-snug text-gray-700">
              {announcement.content}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3">
          {meta}
          {action}
        </div>

      </div>
    </article>
  );
}