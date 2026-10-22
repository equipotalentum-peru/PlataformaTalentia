export function calcularPromedio(componentes: Array<{
  nota: number | string | null;
  porcentaje: number | string | null;
}>) {
  const conNotaYPeso = componentes.filter(
    (componente) => componente.nota !== null && Number(componente.porcentaje ?? 0) > 0
  );
  if (conNotaYPeso.length === 0) return null;

  const promedio = conNotaYPeso.reduce(
    (total, componente) => total + Number(componente.nota) * (Number(componente.porcentaje ?? 0) / 100),
    0
  );
  return Number(promedio.toFixed(2));
}
