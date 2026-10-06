export type ClassStatus =
  | "Finalizada"
  | "Próxima"
  | "Programada"
  | "En curso"
  | "Cancelada";

export type ClassSession = {
  id: number;
  numero: string;
  tema: string;
  fecha: string;
  horario: string;
  estado: ClassStatus;

  docente: string;

  zoomUrl?: string | null;
  recordingUrl?: string | null;

  iniciaEn?: string;
  terminaEn?: string;

  moduloId?: number | null;
  ofertaCursoId?: number;
};