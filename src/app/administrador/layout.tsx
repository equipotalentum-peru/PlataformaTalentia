import SidebarAdmin from "@/components/administrador/sidebar-admin";

export default function AdministradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell app-shell--admin">
      <SidebarAdmin />
      <div className="app-main-column">
        <main className="app-layout-main app-layout-main--admin">
          {children}
        </main>
      </div>
    </div>
  );
}
