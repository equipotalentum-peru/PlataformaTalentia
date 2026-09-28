import TeacherSidebar from "@/components/docente/TeacherSidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#eef2f8]">
      <TeacherSidebar />

      <main className="ml-[247px] min-h-screen">
        {children}
      </main>
    </div>
  );
}