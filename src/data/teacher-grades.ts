export type TeacherGradeRow = {
  id: number;
  alumno: string;
  exam1: number | null;
  practica1: number | null;
  exam2: number | null;
  practica2: number | null;
};

const names = [
  "Rafael Correa",
  "Calima Soto",
  "Diego Ramos",
  "Lucía Mora",
  "Mateo Torres",
  "Valentia Flores",
  "Rodrigo Salazar",
  "Natalia Aguirre",
  "Alex Palacios",
  "María Torres",
  "Carlos Mendoza",
  "Andrea López",
  "Jorge Perez",
  "Valeria Castillo",
  "Diego Salazar",
  "Ronaldo Gamarra",
  "Sofía Vargas",
  "Brenda Castro",
  "Luis Ramírez",
  "Carla Mendoza",
  "Daniel Flores",
  "Paola Rojas",
  "José Torres",
  "Camila Herrera",
  "Mario Sánchez",
  "Ana Salazar",
  "Fernanda Ruiz",
  "Pedro Castro",
  "Miguel Vargas",
  "Gabriela León",
  "Karen Flores",
  "Alberto Torres",
  "Nicole Ramos",
  "Samuel Ortega",
];

export const teacherGrades: TeacherGradeRow[] =
  names.map((alumno, index) => ({
    id: index + 1,
    alumno,
    exam1:
      index % 5 === 0
        ? null
        : 12 + ((index * 3) % 8),
    practica1:
      index % 4 === 0
        ? null
        : 13 + ((index * 2) % 7),
    exam2:
      index % 3 === 0
        ? null
        : 11 + ((index * 4) % 9),
    practica2:
      index % 2 === 0
        ? null
        : 14 + ((index * 2) % 6),
  }));