import type { ChatContact } from "@/data/chat";
import ChatAvatar from "./ChatAvatar";

type Props = {
  contact: ChatContact;
  selected: boolean;
  onSelect: (id: number) => void;
};

export default function ChatContactItem({
  contact,
  selected,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(contact.id)}
      className={`flex w-full items-center gap-3 border-b border-talentia-border px-4 py-3 text-left transition ${
        selected
          ? "bg-talentia-selected"
          : "bg-talentia-surface hover:bg-talentia-hover"
      }`}
    >
      <ChatAvatar
        src={contact.fotoPerfil}
        initials={contact.initials}
        name={contact.name}
        className="h-12 w-12 bg-talentia-blue text-[13px]"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-talentia-primary">
          {contact.name}
        </p>

        <p className="mt-0.5 text-[12px] text-talentia-primary">
          {contact.role}
        </p>
      </div>

      {contact.unread && !selected && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-talentia-teal"
          title="Sin leer"
        />
      )}
    </button>
  );
}