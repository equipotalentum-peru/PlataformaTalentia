import type { ClassStatus as ClassStatusType } from "@/data/classes";

type ClassStatusProps = {
  status: ClassStatusType;
};

export default function ClassStatus({
  status,
}: ClassStatusProps) {
  const styles: Record<ClassStatusType, string> = {
    Finalizada:
      "bg-[#c9efca] text-[#32a348]",

    Próxima:
      "bg-[#77c3fb] text-[#2479c5]",

    Programada:
      "bg-[#77c3fb] text-[#2479c5]",

    "En curso":
      "bg-[#ffe6a3] text-[#c58a00]",

    Cancelada:
      "bg-[#f7c7c7] text-[#c44242]",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[9px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}