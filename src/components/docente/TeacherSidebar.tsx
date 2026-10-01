"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarAccount } from "@/components/common/layout/useSidebarAccount";

export default function TeacherSidebar() {
  const pathname = usePathname();
  const { nombre, cerrarSesion, cerrandoSesion, errorSalida } = useSidebarAccount();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

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
            d="M2 16.144V4.998c0-1.098.886-1.99 1.982-1.923c.977.06 2.131.179 3.018.412c1.05.277 2.296.867 3.282 1.388c.307.163.634.275.968.339v15.179a3.4 3.4 0 0 1-.878-.324c-1-.532-2.29-1.15-3.372-1.436c-.877-.231-2.016-.35-2.985-.41C2.906 18.153 2 17.255 2 16.143m3.182-7.872a.75.75 0 1 0-.364 1.456l4 1a.75.75 0 0 0 .364-1.456zm0 4a.75.75 0 1 0-.364 1.456l4 1a.75.75 0 0 0 .364-1.456zm7.568 8.122q.456-.1.878-.324c1-.532 2.29-1.15 3.372-1.436c.877-.231 2.016-.35 2.985-.41c1.109-.07 2.015-.968 2.015-2.08V4.934c0-1.072-.846-1.953-1.918-1.915c-1.129.04-2.535.156-3.582.47c-.908.271-1.965.816-2.826 1.315a3.5 3.5 0 0 1-.924.37zm6.432-10.665a.75.75 0 0 0-.364-1.456l-4 1a.75.75 0 1 0 .364 1.456zm0 4a.75.75 0 0 0-.364-1.456l-4 1a.75.75 0 1 0 .364 1.456z"
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

  const profileActive = isActive("/docente/perfil");
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[247px] flex-col border-r border-white/60 bg-[#d8e0ee]">
      {/* LOGO */}
      <div className="flex h-[82px] items-center border-b border-white/70 px-5">
        <img
          src="/images/Talentia_grande_sin_fondo.png"
          alt="Talentia - Escuela de Especialización Profesional"
          className="h-auto w-[210px] object-contain"
        />
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-4 py-7">
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-2 flex h-[58px] items-center gap-4 rounded-lg px-7 text-[18px] font-medium transition ${
                active
                  ? "bg-[#0fb4b7] text-black shadow-sm"
                  : "text-gray-800 hover:bg-white/40"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* PERFIL */}
      <div>
        <Link
          href="/docente/perfil"
          className={`group flex h-[62px] w-full items-center gap-3 border-t border-white/70 px-5 text-left transition ${
            profileActive ? "bg-white/40" : "hover:bg-white/30"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eadcff] transition group-hover:bg-white">
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
          </div>

          <span className="min-w-0 truncate text-[17px] font-medium uppercase text-gray-900" title={nombre}>
            {nombre}
          </span>
        </Link>

        {/* CERRAR SESIÓN */}
        <button
          type="button"
          onClick={cerrarSesion}
          disabled={cerrandoSesion}
          className="flex h-[57px] w-full items-center gap-4 border-t border-white/70 px-7 text-left text-[17px] font-medium text-gray-800 transition hover:bg-white/30 disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
          </svg>

          <span>Cerrar sesión</span>
        </button>
        {errorSalida && (
          <p role="alert" className="px-5 pb-2 text-sm text-red-700">
            No se pudo cerrar sesión. Inténtalo de nuevo.
          </p>
        )}
      </div>
    </aside>
  );
}
