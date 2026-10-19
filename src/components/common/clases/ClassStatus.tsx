import type { ClassStatus as ClassStatusType } from "@/data/classes";

type ClassStatusProps = {
  status: ClassStatusType;
};

export default function ClassStatus({
  status,
}: ClassStatusProps) {
  const styles: Record<ClassStatusType, string> = {
    Finalizada:
      "bg-talentia-success-bg text-talentia-success",

    Próxima:
      "bg-talentia-selected text-talentia-blue",

    Programada:
      "bg-talentia-selected text-talentia-blue",

    "En curso":
      "bg-talentia-warning-bg text-talentia-warning",

    Cancelada:
      "bg-talentia-danger-bg text-talentia-danger",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[9px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}