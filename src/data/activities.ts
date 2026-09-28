export type ActivitySubmission = {
  id: number;
  attempt: number;
  submittedAt: string;
  text: string;
  fileName?: string;
  grade?: number;
  maxGrade: number;
  feedback?: string;
};

export type ActivityDefinition = {
  id: number;
  title: string;
  description: string;

  dueDate: string;
  dueTime: string;
  timezone: string;

  maxAttempts: number;
  maxGrade: number;

  allowedFormats: string[];
  maxFileSizeMB: number;

  rubricAvailable: boolean;

  /*
   * Datos de simulación.
   * Más adelante vendrán de Node.js.
   */
  submissions?: ActivitySubmission[];
};

export const activities: ActivityDefinition[] = [
  {
    id: 6,

    title: "Actividad: Herramientas de productividad",

    description:
      "Elabora un informe breve sobre una herramienta de productividad que utilices frecuentemente. Describe sus principales funcionalidades y cómo te ha ayudado en tus actividades académicas o personales.",

    dueDate: "12 de diciembre del 2026",
    dueTime: "23:59",
    timezone: "UTC-5",

    /*
     * Puedes cambiar este valor a:
     * 1, 2, 3, 4, 5...
     */
    maxAttempts: 3,

    maxGrade: 20,

    allowedFormats: [
      "PDF",
      "DOC",
      "DOCX",
      "PPT",
      "PPTX",
      "XLS",
      "XLSX",
      "PNG",
      "JPG",
      "JPEG",
      "RAR",
      "ZIP",
    ],

    maxFileSizeMB: 200,

    rubricAvailable: true,

    /*
     * Déjalo vacío para comenzar sin entregas.
     *
     * Cuando quieras probar la pantalla de
     * "entrega realizada", puedes colocar una
     * entrega simulada aquí.
     */
    submissions: [],
  },
];