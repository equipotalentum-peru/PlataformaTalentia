import StudentSidebar from "@/components/alumno/StudentSidebar";
import ResponsiveFooter from "@/components/common/layout/ResponsiveFooter";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell app-shell--student">
      <StudentSidebar />
      <div className="app-main-column">
        <main className="app-layout-main">{children}</main>
        <ResponsiveFooter />
      </div>
    </div>
  );
}