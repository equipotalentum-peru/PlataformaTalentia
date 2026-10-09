export default function ResponsiveFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span>
        © {year} Talentia. Todos los derechos reservados.
      </span>

      <span className="app-footer__descriptor">
        Plataforma Educativa
      </span>
    </footer>
  );
}