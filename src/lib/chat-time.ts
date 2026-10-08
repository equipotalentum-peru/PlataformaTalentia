export function formatearHoraChat(
  fecha: string | Date
): string {
  const valor =
    fecha instanceof Date
      ? fecha
      : new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      timeZone:
        "America/Lima",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(valor);
}