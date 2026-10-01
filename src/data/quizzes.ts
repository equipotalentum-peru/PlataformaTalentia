export type QuizOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type QuizQuestion = {
  id: number;
  text: string;
  options: QuizOption[];
  correctOptionId: QuizOption["id"];
};

export type QuizDefinition = {
  id: number;
  title: string;
  durationMinutes: number;
  questions: QuizQuestion[];
};

const questionExample: QuizQuestion = {
  id: 1,
  text: "¿Qué son las TIC?",
  correctOptionId: "B",
  options: [
    {
      id: "A",
      text: "Tecnologías que permiten crear únicamente contenido digital.",
    },
    {
      id: "B",
      text: "Tecnologías de la información y comunicación que facilitan la gestión, procesamiento y transmisión de información.",
    },
    {
      id: "C",
      text: "Herramientas utilizadas solo en el ámbito educativo.",
    },
    {
      id: "D",
      text: "Dispositivos físicos que almacenan información.",
    },
  ],
};

/*
 * Las capturas muestran una evaluación de 10 preguntas,
 * pero solo muestran el contenido de una pregunta.
 *
 * Por ahora usamos esta pregunta como contenido de prueba
 * para las 10 posiciones de la interfaz.
 *
 * Cuando tengas las 10 preguntas reales, reemplazamos
 * solamente este arreglo.
 */
const questions: QuizQuestion[] = Array.from(
  { length: 10 },
  (_, index) => ({
    ...questionExample,
    id: index + 1,
  })
);

export const quizzes: QuizDefinition[] = [
  {
    id: 7,
    title: "Practica: TICs",
    durationMinutes: 40,
    questions,
  },
];