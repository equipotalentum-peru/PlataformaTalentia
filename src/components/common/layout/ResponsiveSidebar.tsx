"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type SidebarVariant = "alumno" | "docente" | "admin";

type SidebarItem = {
  label: string;
  href: string;
  icon: ReactNode;
  active: boolean;
};

type ResponsiveSidebarProps = {
  variant: SidebarVariant;
  roleLabel: string;
  items: SidebarItem[];
  children: ReactNode;
};

export default function ResponsiveSidebar({
  variant,
  roleLabel,
  items,
  children,
}: ResponsiveSidebarProps) {
  const pathname = usePathname();

  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuAbierto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    };

    window.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [menuAbierto]);

  const claseSidebar = [
    "app-sidebar",
    `app-sidebar--${variant}`,
    menuAbierto ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header className={`app-mobile-header app-mobile-header--${variant}`}>
        <button
          type="button"
          className="app-mobile-header__menu"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú de navegación"
          aria-controls={`talentia-sidebar-${variant}`}
          aria-expanded={menuAbierto}
        >
          <svg
            viewBox="0 0 24 24"
            width="25"
            height="25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>

          <span>Menú</span>
        </button>

        <Image
          src="/images/Talentia_grande_sin_fondo.png"
          alt="Talentia"
          width={180}
          height={48}
          priority
          className="app-mobile-header__logo"
        />

        <span className="app-mobile-header__role">
          {roleLabel}
        </span>
      </header>

      <button
        type="button"
        className={`app-sidebar__backdrop ${
          menuAbierto ? "is-visible" : ""
        }`}
        onClick={() => setMenuAbierto(false)}
        aria-label="Cerrar menú de navegación"
        tabIndex={menuAbierto ? 0 : -1}
      />

      <aside
        id={`talentia-sidebar-${variant}`}
        className={claseSidebar}
        aria-label={`Navegación de ${roleLabel.toLowerCase()}`}
      >
        <div className="app-sidebar__brand">
          <Image
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia - Plataforma Educativa"
            width={210}
            height={60}
            priority
            className="app-sidebar__logo"
          />

          <button
            type="button"
            className="app-sidebar__close"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="app-sidebar__nav">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuAbierto(false)}
              aria-current={item.active ? "page" : undefined}
              className={`app-sidebar__link ${
                item.active ? "is-active" : ""
              }`}
            >
              <span
                className="app-sidebar__link-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span className="app-sidebar__link-label">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="app-sidebar__account">
          {children}
        </div>
      </aside>
    </>
  );
}