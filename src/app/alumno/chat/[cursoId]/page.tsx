import ChatConversation from "@/components/common/chat/ChatConversation";

type Props = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function StudentChatConversationPage({
  params,
}: Props) {
  const { cursoId } = await params;

  return (
    <ChatConversation cursoId={cursoId} />
  );
}