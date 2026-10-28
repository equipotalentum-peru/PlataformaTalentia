"use client";

type Filter = "Todos" | "Sin leer" | "Leídos";

type Props = {
  value: Filter;
  onChange: (value: Filter) => void;
};

export default function ChatFilters({ value, onChange }: Props) {
  const filters: Filter[] = ["Todos", "Sin leer", "Leídos"];

  return (
    <div className="flex w-fit max-w-full items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          aria-pressed={value === filter}
          className={`inline-flex h-9 min-w-[60px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2 text-[13px] leading-none font-semibold transition ${
            value === filter
              ? "border-talentia-blue bg-talentia-action text-white"
              : "border-talentia-border bg-talentia-surface text-talentia-primary hover:bg-talentia-primary hover:text-white"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}