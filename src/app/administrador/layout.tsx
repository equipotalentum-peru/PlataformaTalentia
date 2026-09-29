import SidebarAdmin from "@/components/administrador/sidebar-admin";

export default function AdministradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#EEF2F8] font-sans">
      {/* El Sidebar se mantiene persistente en todas las vistas de administrador */}
      <SidebarAdmin />

      {/* Aquí se renderizan las páginas (/dashboard, /usuarios, /cursos, etc.) */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}