"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ResponsiveSidebar from "@/components/common/layout/ResponsiveSidebar";
import { useSidebarAccount } from "@/components/common/layout/useSidebarAccount";
import SidebarAvatar from "@/components/common/layout/SidebarAvatar";

export default function TeacherSidebar() {
  const pathname = usePathname();

  const {
    nombre,
    fotoPerfil,
    cerrarSesion,
    cerrandoSesion,
    errorSalida,
  } = useSidebarAccount();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const menuItems = [
    {
      label: "Dashboard",
      href: "/docente/dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            fill="currentColor"
            d="M14 9q-.425 0-.712-.288T13 8V4q0-.425.288-.712T14 3h6q.425 0 .713.288T21 4v4q0 .425-.288.713T20 9zM4 13q-.425 0-.712-.288T3 12V4q0-.425.288-.712T4 3h6q.425 0 .713.288T11 4v8q0 .425-.288.713T10 13zm10 8q-.425 0-.712-.288T13 20v-8q0-.425.288-.712T14 11h6q.425 0 .713.288T21 12v8q0 .425-.288.713T20 21zM4 21q-.425 0-.712-.288T3 20v-4q0-.425.288-.712T4 15h6q.425 0 .713.288T11 16v4q0 .425-.288.713T10 21z"
          />
        </svg>
      ),
    },
    {
      label: "Mis Cursos",
      href: "/docente/cursos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M2 16.144V4.998c0-1.098.886-1.99 1.982-1.923c.977.06 2.131.179 3.018.412c1.05.277 2.296.867 3.282 1.388c.307.163.634.275.968.339v15.179a3.4 3.4 0 0 1-.878-.324c-1-.532-2.29-1.15-3.372-1.436c-.877-.231-2.016-.35-2.985-.41C2.906 18.153 2 17.255 2 16.143m3.182-7.872a.75.75 0 1 0-.364 1.456l4 1a.75.75 0 0 0 .364-1.456zm0 4a.75.75 0 1 0-.364 1.456l4 1a.75.75 0 0 0-.364-1.456zm7.568 8.122q.456-.1.878-.324c1-.532 2.29-1.15 3.372-1.436c.877-.231 2.016-.35 2.985-.41c1.109-.07 2.015-.968 2.015-2.08V4.934c0-1.072-.846-1.953-1.918-1.915c-1.129.04-2.535.156-3.582.47c-.908.271-1.965.816-2.826 1.315a3.5 3.5 0 0 1-.924.37zm6.432-10.665a.75.75 0 0 0-.364-1.456l-4 1a.75.75 0 1 0 .364 1.456zm0 4a.75.75 0 0 0-.364-1.456l-4 1a.75.75 0 1 0 .364 1.456z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      label: "Calificaciones",
      href: "/docente/calificaciones",
      icon: (
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h3" />
          <path d="M8 16h5" />
          <path d="M16 15v4" />
          <path d="M14 17h4" />
        </svg>
      ),
    },
    {
      label: "Chat",
      href: "/docente/chat",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 16 16"
        >
          <path d="M0 0h16v16H0z" fill="none" />
          <path
            fill="currentColor"
            d="M16 8c0 3.866-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234c-.2.032-.352-.176-.273-.362c.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M5 8a1 1 0 1 0-2 0a1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0a1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2"
          />
        </svg>
      ),
    },
  ];

  return (
    <ResponsiveSidebar
      variant="docente"
      roleLabel="Panel del docente"
      items={menuItems.map((item) => ({
        ...item,
        active: isActive(item.href),
      }))}
    >
      <Link
        href="/docente/perfil"
        className={`app-sidebar-account-link ${
          isActive("/docente/perfil") ? "is-active" : ""
        }`}
      >
        <div className="app-sidebar-account-avatar app-sidebar-account-avatar--teacher">
          <SidebarAvatar fotoPerfil={fotoPerfil} nombre={nombre}>
            <svg
              className="h-6 w-6 text-[#6f42a5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.4 3.2-5.3 7-5.3s6.2 1.9 7 5.3" />
            </svg>
          </SidebarAvatar>
        </div>

        <span className="app-sidebar-account-name" title={nombre}>
          {nombre}
        </span>
      </Link>

      <button
        type="button"
        onClick={cerrarSesion}
        disabled={cerrandoSesion}
        className="app-sidebar-logout"
      >
        <svg
          className="h-6 w-6 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </svg>

        <span>
          {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
        </span>
      </button>

      {errorSalida && (
        <p role="alert" className="app-sidebar-error">
          No se pudo cerrar sesión. Inténtalo de nuevo.
        </p>
      )}
    </ResponsiveSidebar>
  );
}