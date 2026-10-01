type ClassHeaderProps = {
  onSchedule?: () => void;
  showTeacherActions?: boolean;
};

export default function ClassHeader({
  onSchedule,
  showTeacherActions = false,
}: ClassHeaderProps) {
  return (
    <section className="mb-2 flex flex-col gap-3 px-1 py-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#ead5f5]">
          <svg
            className="h-6 w-6 text-[#3186d8]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
            />
            <path d="m8 9 3 3-3 3" />
            <path d="M13 15h3" />
          </svg>
        </div>

        <div>
          <h2 className="text-[15px] font-bold text-[#3186d8]">
            Clases virtuales
          </h2>

          <p className="text-[9px] text-[#3186d8]">
            Programa, gestiona y realiza el seguimiento de tus clases en vivo
          </p>
        </div>
      </div>

      {showTeacherActions && (
        <button
          type="button"
          onClick={onSchedule}
          className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#3186d8] px-4 text-[10px] font-semibold text-white transition hover:bg-[#2777c1]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>

          Programar clase
        </button>
      )}
    </section>
  );
}