import type { ReactNode } from "react";
import type { Forum } from "@/data/forums";
import ForumCard from "./ForumCard";

type ForumListProps<T extends Forum = Forum> = {
  forums: T[];
  courseId: number;
  basePath: "alumno" | "docente";
  renderMeta?: (forum: T) => ReactNode;
  renderActions?: (forum: T) => ReactNode;
};

export default function ForumList<T extends Forum = Forum>({
  forums,
  courseId,
  basePath,
  renderMeta,
  renderActions,
}: ForumListProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {forums.map((forum) => (
        <ForumCard
          key={forum.id}
          forum={forum}
          href={`/${basePath}/cursos/${courseId}/foro/${forum.id}`}
          meta={renderMeta?.(forum)}
          actions={renderActions?.(forum)}
        />
      ))}
    </div>
  );
}