"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ResponsiveSidebar from "@/components/common/layout/ResponsiveSidebar";
import { useSidebarAccount } from "@/components/common/layout/useSidebarAccount";
import SidebarAvatar from "@/components/common/layout/SidebarAvatar";

export default function SidebarAdmin() {
  const pathname = usePathname();

  const {
    nombre,
    iniciales,
    fotoPerfil,
    cerrarSesion,
    cerrandoSesion,
    errorSalida,
  } = useSidebarAccount();

  const navItems = [
    { name: "Dashboard", href: "/administrador/dashboard", letter: "D" },
    { name: "Usuarios", href: "/administrador/usuarios", letter: "U" },
    { name: "Cursos", href: "/administrador/cursos", letter: "C" },
    { name: "Matrículas", href: "/administrador/matriculas", letter: "M" },
    { name: "Reportes", href: "/administrador/reportes", letter: "R" },
    {
      name: "Solicitudes Personas",
      href: "/administrador/solicitudes-personas",
      letter: "P",
    },
    {
      name: "Solicitudes Empresas",
      href: "/administrador/solicitudes-empresas",
      letter: "E",
    },
  ];

  return (
    <ResponsiveSidebar
      variant="admin"
      roleLabel="Panel del administrador"
      items={navItems.map((item) => ({
        label: item.name,
        href: item.href,
        active:
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`),
        icon: (
          <span
            className={`app-sidebar-admin-letter ${
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)
                ? "is-active"
                : ""
            }`}
          >
            {item.letter}
          </span>
        ),
      }))}
    >
      <Link
        href="/administrador/perfil"
        aria-current={
          pathname === "/administrador/perfil"
            ? "page"
            : undefined
        }
        className={`app-sidebar-account-link app-sidebar-account-link--admin ${
          pathname === "/administrador/perfil"
            ? "is-active"
            : ""
        }`}
      >
        <div className="app-sidebar-account-avatar app-sidebar-account-avatar--admin">
          <SidebarAvatar fotoPerfil={fotoPerfil} nombre={nombre}>
            {iniciales || "?"}
          </SidebarAvatar>
        </div>

        <div className="app-sidebar-account-details">
          <p className="app-sidebar-account-name">{nombre}</p>
          <p className="app-sidebar-account-role">Administrador</p>
        </div>

        <span className="app-sidebar-account-arrow" aria-hidden="true">
          ›
        </span>
      </Link>

      <button
        type="button"
        onClick={cerrarSesion}
        disabled={cerrandoSesion}
        className="app-sidebar-logout app-sidebar-logout--admin"
      >
        <span aria-hidden="true">⇆</span>
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