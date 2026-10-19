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
    <article className="flex items-center gap-3 rounded-lg bg-talentia-surface px-3 py-3 shadow-sm sm:gap-4 sm:px-5">

      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-talentia-action text-[12px] font-semibold text-white sm:h-12 sm:w-12 sm:text-[13px]">
          {forum.initials}
        </div>

        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-talentia-primary">
            {forum.title}
          </h3>

          <p className="mt-0.5 max-w-[590px] truncate text-[10px] leading-snug text-talentia-primary">
            {forum.description}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {meta}

        {actions}
      </div>
    </article>
  );
}