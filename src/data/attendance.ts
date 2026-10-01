export type AttendanceState = "presente" | "falta";

export type AttendanceStudent = {
  id: number;
  nombre: string;
  semanas: AttendanceState[];
};

const createWeeks = (
  pattern: AttendanceState[]
): AttendanceState[] => {
  return Array.from({ length: 21 }, (_, index) => {
    return pattern[index % pattern.length];
  });
};

export const attendanceStudents: AttendanceStudent[] = [
  {
    id: 1,
    nombre: "Diego Hugo Alfaro Fernandez",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
    ]),
  },
  {
    id: 2,
    nombre: "Rosario Ponce Huaman",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
    ]),
  },
  {
    id: 3,
    nombre: "Rafael Correa Perez",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
    ]),
  },
  {
    id: 4,
    nombre: "Luz Alvarado Varela",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
    ]),
  },
  {
    id: 5,
    nombre: "Yenifer Ana Rubio Morales",
    semanas: createWeeks([
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
      "presente",
    ]),
  },
  {
    id: 6,
    nombre: "Alexsandra Gamarra Gamboa",
    semanas: createWeeks([
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
      "presente",
    ]),
  },
  {
    id: 7,
    nombre: "Alexandra Flores",
    semanas: createWeeks([
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
    ]),
  },
  {
    id: 8,
    nombre: "Diego Salazar",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
    ]),
  },
  {
    id: 9,
    nombre: "Maria Torres",
    semanas: createWeeks([
      "presente",
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
    ]),
  },
  {
    id: 10,
    nombre: "Carlos Mendoza",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "falta",
      "presente",
    ]),
  },
  {
    id: 11,
    nombre: "Lucia Ramirez",
    semanas: createWeeks([
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
    ]),
  },
  {
    id: 12,
    nombre: "Valeria Flores",
    semanas: createWeeks([
      "presente",
      "presente",
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
    ]),
  },
  {
    id: 13,
    nombre: "Jorge Perez",
    semanas: createWeeks([
      "presente",
      "presente",
      "falta",
      "presente",
      "presente",
      "presente",
      "presente",
      "presente",
    ]),
  },
];