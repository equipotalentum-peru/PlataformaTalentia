type MentionInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onSelectSuggestion: (user: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function MentionInput({
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  placeholder = "Escribe tu respuesta...",
  disabled = false,
}: MentionInputProps) {
  return (
    <div className="relative">
      <input
        value={value}
        disabled={disabled}
        maxLength={10000}
        aria-label="Escribe tu respuesta"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-gray-300 px-3 text-[11px] outline-none focus:border-[#3186d8]"
      />

      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-[240px] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          {suggestions.map((user) => (
            <button
              key={user}
              type="button"
              onClick={() => onSelectSuggestion(user)}
              className="block w-full rounded px-2 py-1.5 text-left text-[10px] hover:bg-[#eef5fc]"
            >
              @{user}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
