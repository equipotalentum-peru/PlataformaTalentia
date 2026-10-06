import type { ClassSession } from "@/data/classes";
import ClassTable from "./ClassTable";

type ClassListProps = {
  classes: ClassSession[];
  role: "student" | "teacher";
  onEdit?: (classSession: ClassSession) => void;
  onCancel?: (classSession: ClassSession) => void;
  onStart?: (classSession: ClassSession) => void;
  onDetails?: (classSession: ClassSession) => void;
  onRecording?: (classSession: ClassSession) => void;
  onJoin?: (classSession: ClassSession) => void;
};

export default function ClassList({
  classes,
  role,
  onEdit,
  onCancel,
  onStart,
  onDetails,
  onRecording,
  onJoin,
}: ClassListProps) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="px-5 py-4">
        <h2 className="text-[16px] font-bold text-gray-900">
          Todas las clases
        </h2>
      </div>

      <ClassTable
        classes={classes}
        role={role}
        onEdit={onEdit}
        onCancel={onCancel}
        onStart={onStart}
        onDetails={onDetails}
        onRecording={onRecording}
        onJoin={onJoin}
      />
    </section>
  );
}