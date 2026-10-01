"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarAccount } from "@/components/common/layout/useSidebarAccount";

export default function SidebarAdmin() {
  const pathname = usePathname();
  const { nombre, iniciales, cerrarSesion, cerrandoSesion, errorSalida } = useSidebarAccount();

  const navItems = [
    { name: "Dashboard", href: "/administrador/dashboard", letter: "D" },
    { name: "Usuarios", href: "/administrador/usuarios", letter: "U" },
    { name: "Cursos", href: "/administrador/cursos", letter: "C" },
    { name: "Matrículas", href: "/administrador/matriculas", letter: "M" },
    { name: "Reportes", href: "/administrador/reportes", letter: "R" },
  ];

  return (
    <aside className="w-[260px] bg-[#DDE6F5] p-6 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo Talentia */}
        <div className="relative w-44 h-14 mb-8">
          <Image
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Menú de Navegación con detección de ruta activa */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition ${
                  isActive
                    ? "bg-[#D1E0FA] text-[#0F2851] font-bold shadow-sm"
                    : "text-[#4A607A] hover:bg-white/40"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? "bg-[#2D97E8] text-white"
                      : "text-[#2D97E8] bg-transparent"
                  }`}
                >
                  {item.letter}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Perfil Inferior y Cerrar Sesión */}
      <div className="space-y-4 pt-6 border-t border-[#C0D2EC]">
        <Link
          href="/administrador/perfil"
          aria-current={pathname === "/administrador/perfil" ? "page" : undefined}
          className="flex items-center gap-3 rounded-md transition hover:bg-white/40"
        >
          <div className="w-10 h-10 rounded-full bg-[#C2DAF8] border border-white flex items-center justify-center text-sm font-bold text-[#183665]">
            {iniciales || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0F2851] truncate">
              {nombre}
            </p>
            <p className="text-xs text-[#6F83A5] truncate">Administrador</p>
          </div>
          <span className="text-[#6F83A5] text-xs">❯</span>
        </Link>

        <button
          type="button"
          onClick={cerrarSesion}
          disabled={cerrandoSesion}
          className="flex items-center gap-2 text-sm text-[#4A607A] hover:text-[#0F2851] transition font-medium w-full pt-2 disabled:cursor-wait disabled:opacity-60"
        >
          <span>⇆</span> Cerrar sesión
        </button>
        {errorSalida && (
          <p role="alert" className="text-sm text-red-700">
            No se pudo cerrar sesión. Inténtalo de nuevo.
          </p>
        )}
      </div>
    </aside>
  );
}
