import TeacherSidebar from "@/components/docente/TeacherSidebar";
import ResponsiveFooter from "@/components/common/layout/ResponsiveFooter";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell app-shell--teacher">
      <TeacherSidebar />
      <div className="app-main-column">
        <main className="app-layout-main">{children}</main>
        <ResponsiveFooter />
      </div>
    </div>
  );
}