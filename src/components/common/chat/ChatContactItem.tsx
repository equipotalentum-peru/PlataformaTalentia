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
      className={`flex w-full items-center gap-3 border-b border-gray-200 px-4 py-3 text-left transition ${
        selected
          ? "bg-[#9558f5]"
          : "bg-white hover:bg-[#f5f7fa]"
      }`}
    >
      <ChatAvatar
        src={contact.fotoPerfil}
        initials={contact.initials}
        name={contact.name}
        className="h-12 w-12 bg-[#11b7b8] text-[11px]"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-gray-900">
          {contact.name}
        </p>

        <p className="mt-0.5 text-[10px] text-gray-700">
          {contact.role}
        </p>
      </div>

      {contact.unread && !selected && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3186d8]"
          title="Sin leer"
        />
      )}
    </button>
  );
}