export function construirSalaChat(
  ofertaCursoId: number,
  usuarioA: number,
  usuarioB: number
) {
  const usuario1 = Math.min(usuarioA, usuarioB);
  const usuario2 = Math.max(usuarioA, usuarioB);

  return `chat:${ofertaCursoId}:${usuario1}:${usuario2}`;
}

export function construirSalaUsuario(
  usuarioId: number
) {
  return `usuario:${usuarioId}`;
}