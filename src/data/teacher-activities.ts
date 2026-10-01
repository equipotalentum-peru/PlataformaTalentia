export type TeacherStudent = {
  id: number;
  initials: string;
  name: string;
  status: "Entregada" | "Pendiente";
  grade: number | null;
  attemptsUsed: number;
  submissionText?: string;
  fileName?: string;
  fileSize?: string;
};

export const teacherActivityStudents: TeacherStudent[] = [
  {
    id: 1,
    initials: "RC",
    name: "Rafael Correa",
    status: "Entregada",
    grade: 18.2,
    attemptsUsed: 1,
    submissionText:
      "Buenas tardes profesora. Aquí le envío el informe requerido para esta actividad.",
    fileName: "Informe Herramientas TIC.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: 2,
    initials: "CS",
    name: "Calima Soto",
    status: "Entregada",
    grade: 16,
    attemptsUsed: 1,
  },
  {
    id: 3,
    initials: "DR",
    name: "Diego Ramos",
    status: "Pendiente",
    grade: null,
    attemptsUsed: 0,
  },
  {
    id: 4,
    initials: "LM",
    name: "Lucía Mora",
    status: "Entregada",
    grade: 18,
    attemptsUsed: 1,
  },
  {
    id: 5,
    initials: "MT",
    name: "Mateo Torres",
    status: "Pendiente",
    grade: null,
    attemptsUsed: 0,
  },
  {
    id: 6,
    initials: "VF",
    name: "Valentia Flores",
    status: "Entregada",
    grade: 15,
    attemptsUsed: 1,
  },
  {
    id: 7,
    initials: "RS",
    name: "Rodrigo Salazar",
    status: "Pendiente",
    grade: null,
    attemptsUsed: 0,
  },
  {
    id: 8,
    initials: "NA",
    name: "Natalia Aguirre",
    status: "Entregada",
    grade: 17,
    attemptsUsed: 1,
  },
  {
    id: 9,
    initials: "AP",
    name: "Alex Palacios",
    status: "Pendiente",
    grade: null,
    attemptsUsed: 0,
  },
];