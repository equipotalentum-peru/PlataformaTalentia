import ChatConversation from "@/components/common/chat/ChatConversation";

type Props = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function TeacherChatConversationPage({
  params,
}: Props) {
  const { cursoId } = await params;

  return (
    <ChatConversation cursoId={cursoId} />
  );
}