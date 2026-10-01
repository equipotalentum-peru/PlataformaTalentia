import Link from "next/link";
import type { ReactNode } from "react";
import type { Forum } from "@/data/forums";

type ForumCardProps = {
  forum: Forum;
  href: string;
  meta?: ReactNode;
  actions?: ReactNode;
};

export default function ForumCard({
  forum,
  href,
  meta,
  actions,
}: ForumCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-lg bg-white px-5 py-3 shadow-sm">

      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00b8b3] text-[13px] font-semibold text-white">
          {forum.initials}
        </div>

        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-gray-900">
            {forum.title}
          </h3>

          <p className="mt-0.5 max-w-[590px] truncate text-[10px] leading-snug text-gray-700">
            {forum.description}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-3">
        {meta}

        {actions}
      </div>
    </article>
  );
}