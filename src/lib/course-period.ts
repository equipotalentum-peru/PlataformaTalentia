function leerFecha(fecha: string | null | undefined) {
  if (!fecha) return null;
  const valor = new Date(`${fecha}T00:00:00Z`);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

export function formatearFechaPeriodo(fecha: string | null | undefined) {
  const valor = leerFecha(fecha);
  return valor ? valor.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Por definir";
}

export function duracionPeriodoMeses(fechaInicio: string | null | undefined, fechaFin: string | null | undefined) {
  const inicio = leerFecha(fechaInicio);
  const fin = leerFecha(fechaFin);
  if (!inicio || !fin || fin < inicio) return "Por definir";
  const mesesCompletos = (fin.getUTCFullYear() - inicio.getUTCFullYear()) * 12 + fin.getUTCMonth() - inicio.getUTCMonth();
  const meses = Math.max(1, mesesCompletos + (fin.getUTCDate() > inicio.getUTCDate() ? 1 : 0));
  return `${meses} ${meses === 1 ? "mes" : "meses"}`;
}
