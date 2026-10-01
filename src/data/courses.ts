export type Course = {
  id: number;
  nombre: string;
  codigo: string;
  imagen: string;
  alumnos: number;
  actividades: number;
  evaluaciones: number;
  progreso: number;
  accent: string;
};

export const courses: Course[] = [
  {
    id: 1,
    nombre: "Herramientas TIC",
    codigo: "HT001",
    imagen:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    alumnos: 128,
    actividades: 8,
    evaluaciones: 2,
    progreso: 60,
    accent: "#54d6d8",
  },
  {
    id: 2,
    nombre: "Programación",
    codigo: "P001",
    imagen:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
    alumnos: 128,
    actividades: 8,
    evaluaciones: 2,
    progreso: 60,
    accent: "#b765d9",
  },
  {
    id: 3,
    nombre: "Psicología",
    codigo: "PSI001",
    imagen:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
    alumnos: 82,
    actividades: 8,
    evaluaciones: 2,
    progreso: 60,
    accent: "#ee9acb",
  },
  {
    id: 4,
    nombre: "Matemáticas",
    codigo: "MAT001",
    imagen:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    alumnos: 64,
    actividades: 8,
    evaluaciones: 2,
    progreso: 60,
    accent: "#55d3d3",
  },
  {
    id: 5,
    nombre: "Algoritmos",
    codigo: "ALG001",
    imagen:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    alumnos: 91,
    actividades: 8,
    evaluaciones: 2,
    progreso: 60,
    accent: "#b9d878",
  },
];