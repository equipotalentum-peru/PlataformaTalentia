export type ContentType =
  | "pdf"
  | "video"
  | "ppt"
  | "word"
  | "activity"
  | "quiz"
  | "link";

export type CourseContent = {
  id: number;
  courseId: number;
  moduleId: number;
  order: number;
  title: string;
  type: ContentType;
  file?: string;
};

export type CourseModule = {
  id: number;
  title: string;
};

export const courseModules: CourseModule[] = [
  {
    id: 1,
    title: "Introducción a las TIC",
  },
  {
    id: 2,
    title: "Herramientas de productividad",
  },
  {
    id: 3,
    title: "Colaboración en la nube",
  },
  {
    id: 4,
    title: "Seguridad digital",
  },
  {
    id: 5,
    title: "Comunicación digital",
  },
  {
    id: 6,
    title: "Gestión y organización de la información",
  },
  {
    id: 7,
    title: "Herramientas de creación de contenido",
  },
  {
    id: 8,
    title: "Inteligencia artificial aplicada",
  },
  {
    id: 9,
    title: "Proyecto final",
  },
];

export const courseContents: CourseContent[] = [
  // =========================================================
  // MÓDULO 1
  // =========================================================

  {
    id: 1,
    courseId: 1,
    moduleId: 1,
    order: 1,
    title: "¿Qué son las TIC?",
    type: "pdf",
    file: "/contenidos/herramientas-tic/modulo-1/1-1-que-son-las-tic.pdf",
  },

  {
    id: 2,
    courseId: 1,
    moduleId: 1,
    order: 2,
    title: "Evolución de las TIC",
    type: "video",
    file: "/contenidos/herramientas-tic/modulo-1/1-2-evolucion-de-las-tic.mp4",
  },

  {
    id: 3,
    courseId: 1,
    moduleId: 1,
    order: 3,
    title: "Impacto de las TIC en la sociedad",
    type: "ppt",
    file: "/contenidos/herramientas-tic/modulo-1/1-3-impacto-de-las-tic.pptx",
  },

  {
    id: 4,
    courseId: 1,
    moduleId: 1,
    order: 4,
    title: "Conceptos fundamentales de las TIC",
    type: "word",
    file: "/contenidos/herramientas-tic/modulo-1/1-4-conceptos.docx",
  },

  {
    id: 5,
    courseId: 1,
    moduleId: 1,
    order: 5,
    title: "Aplicaciones de las TIC",
    type: "link",
  },

  {
    id: 6,
    courseId: 1,
    moduleId: 1,
    order: 6,
    title: "Actividad: Las TIC en mi entorno",
    type: "activity",
  },

  {
    id: 7,
    courseId: 1,
    moduleId: 1,
    order: 7,
    title: "Cuestionario: Introducción a las TIC",
    type: "quiz",
  },

  {
    id: 8,
    courseId: 1,
    moduleId: 1,
    order: 8,
    title: "Ventajas y desafíos de las TIC",
    type: "pdf",
  },

  {
    id: 9,
    courseId: 1,
    moduleId: 1,
    order: 9,
    title: "TIC en la educación y el trabajo",
    type: "video",
  },

  {
    id: 10,
    courseId: 1,
    moduleId: 1,
    order: 10,
    title: "Recursos complementarios",
    type: "link",
  },

  // =========================================================
  // MÓDULO 2
  // =========================================================

  {
    id: 11,
    courseId: 1,
    moduleId: 2,
    order: 1,
    title: "Introducción a herramientas de productividad",
    type: "link",
  },

  {
    id: 12,
    courseId: 1,
    moduleId: 2,
    order: 2,
    title: "Actividad práctica de productividad",
    type: "activity",
  },

  {
    id: 13,
    courseId: 1,
    moduleId: 2,
    order: 3,
    title: "Cuestionario del módulo 2",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 3
  // =========================================================

  {
    id: 14,
    courseId: 1,
    moduleId: 3,
    order: 1,
    title: "Conceptos de colaboración en la nube",
    type: "link",
  },

  {
    id: 15,
    courseId: 1,
    moduleId: 3,
    order: 2,
    title: "Actividad: trabajo colaborativo",
    type: "activity",
  },

  {
    id: 16,
    courseId: 1,
    moduleId: 3,
    order: 3,
    title: "Cuestionario del módulo 3",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 4
  // =========================================================

  {
    id: 17,
    courseId: 1,
    moduleId: 4,
    order: 1,
    title: "Fundamentos de seguridad digital",
    type: "link",
  },

  {
    id: 18,
    courseId: 1,
    moduleId: 4,
    order: 2,
    title: "Actividad: buenas prácticas de seguridad",
    type: "activity",
  },

  {
    id: 19,
    courseId: 1,
    moduleId: 4,
    order: 3,
    title: "Evaluación de seguridad digital",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 5
  // =========================================================

  {
    id: 20,
    courseId: 1,
    moduleId: 5,
    order: 1,
    title: "Comunicación en entornos digitales",
    type: "link",
  },

  {
    id: 21,
    courseId: 1,
    moduleId: 5,
    order: 2,
    title: "Actividad de comunicación digital",
    type: "activity",
  },

  {
    id: 22,
    courseId: 1,
    moduleId: 5,
    order: 3,
    title: "Cuestionario del módulo 5",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 6
  // =========================================================

  {
    id: 23,
    courseId: 1,
    moduleId: 6,
    order: 1,
    title: "Gestión de información",
    type: "link",
  },

  {
    id: 24,
    courseId: 1,
    moduleId: 6,
    order: 2,
    title: "Actividad práctica de organización",
    type: "activity",
  },

  {
    id: 25,
    courseId: 1,
    moduleId: 6,
    order: 3,
    title: "Cuestionario del módulo 6",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 7
  // =========================================================

  {
    id: 26,
    courseId: 1,
    moduleId: 7,
    order: 1,
    title: "Introducción a la creación de contenido",
    type: "link",
  },

  {
    id: 27,
    courseId: 1,
    moduleId: 7,
    order: 2,
    title: "Actividad: creación de contenido",
    type: "activity",
  },

  {
    id: 28,
    courseId: 1,
    moduleId: 7,
    order: 3,
    title: "Cuestionario del módulo 7",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 8
  // =========================================================

  {
    id: 29,
    courseId: 1,
    moduleId: 8,
    order: 1,
    title: "Introducción a la inteligencia artificial",
    type: "link",
  },

  {
    id: 30,
    courseId: 1,
    moduleId: 8,
    order: 2,
    title: "Actividad: IA aplicada",
    type: "activity",
  },

  {
    id: 31,
    courseId: 1,
    moduleId: 8,
    order: 3,
    title: "Cuestionario del módulo 8",
    type: "quiz",
  },

  // =========================================================
  // MÓDULO 9
  // =========================================================

  {
    id: 32,
    courseId: 1,
    moduleId: 9,
    order: 1,
    title: "Presentación del proyecto final",
    type: "link",
  },

  {
    id: 33,
    courseId: 1,
    moduleId: 9,
    order: 2,
    title: "Desarrollo del proyecto",
    type: "activity",
  },

  {
    id: 34,
    courseId: 1,
    moduleId: 9,
    order: 3,
    title: "Entrega del proyecto final",
    type: "activity",
  },
];