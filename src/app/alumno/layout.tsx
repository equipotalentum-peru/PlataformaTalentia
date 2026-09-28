import StudentSidebar from "@/components/alumno/StudentSidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#eef2f8]">
      <StudentSidebar />

      <main className="ml-[247px] min-h-screen">
        {children}
      </main>
    </div>
  );
}