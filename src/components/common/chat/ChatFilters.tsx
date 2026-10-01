type Filter = "Todos" | "Sin leer" | "Leídos";

type Props = {
  value: Filter;
  onChange: (value: Filter) => void;
};

export default function ChatFilters({
  value,
  onChange,
}: Props) {
  const filters: Filter[] = [
    "Todos",
    "Sin leer",
    "Leídos",
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition ${
            value === filter
              ? "border-[#3186d8] bg-[#3186d8] text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}