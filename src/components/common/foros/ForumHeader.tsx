import type { ReactNode } from "react";

type ForumHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  action?: ReactNode;
};

export default function ForumHeader({
  search,
  onSearchChange,
  action,
}: ForumHeaderProps) {
  return (
    <section className="rounded-xl bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00b8b3]">
            <svg
              className="h-8 w-8 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
            </svg>
          </div>

          <div>
            <h2 className="text-[15px] font-bold text-[#3186d8]">
              Foros del curso
            </h2>

            <p className="text-[10px] leading-snug text-gray-600">
              Crea espacios de discusión, modera las conversaciones
              y fomenta la participación.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex h-9 w-full min-w-[215px] items-center rounded-md border border-gray-300 px-3">
            <svg
              className="mr-2 h-4 w-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              value={search}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              type="text"
              placeholder="Buscar foro"
              className="w-full bg-transparent text-[10px] outline-none"
            />
          </div>

          {action}
        </div>
      </div>
    </section>
  );
}