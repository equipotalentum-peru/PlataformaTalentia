export type ComponenteCalificacionDraft = {
  id: string;
  nombre: string;
  porcentaje: string;
};

export type DocenteDisponible = {
  id: string;
  nombre: string;
  carga: number;
};

export type CursoAdminFila = {
  id: string;
  nombre: string;
  codigo: string;
  docente: string;
  matriculados: number;
  cupos: number;
  estado: string;
};
