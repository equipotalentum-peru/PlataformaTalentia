import type { ReactNode } from "react";
import type { Announcement } from "@/data/announcements";

import AnnouncementCard from "./AnnouncementCard";

type AnnouncementListProps<
  T extends Announcement = Announcement,
> = {
  announcements: T[];
  renderMeta?: (announcement: T) => ReactNode;
  renderAction?: (announcement: T) => ReactNode;
  isUnread?: (announcement: T) => boolean;
};

export default function AnnouncementList<
  T extends Announcement = Announcement,
>({
  announcements,
  renderMeta,
  renderAction,
  isUnread,
}: AnnouncementListProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          meta={renderMeta?.(announcement)}
          action={renderAction?.(announcement)}
          unread={isUnread?.(announcement) ?? false}
        />
      ))}
    </div>
  );
}