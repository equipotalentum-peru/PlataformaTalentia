export type ForumReply = {
  id: number;
  author: string;
  initials: string;
  date: string;
  content: string;
  replies?: ForumReply[];
};

export type Forum = {
  id: string;
  title: string;
  description: string;
  author: string;
  initials: string;
  repliesCount: number;
  date: string;
  time: string;
  replies: ForumReply[];
};

export const forums: Forum[] = [
  {
    id: "presentacion",
    title: "Presentación",
    description:
      "Buenas tardes chicos, este foro es para conocernos mejor. Por favor me hacen una bibliografía suya.",
    author: "Gloria Rocha",
    initials: "GR",
    repliesCount: 12,
    date: "Sab, 5 de sep. de 2026",
    time: "15:30",
    replies: [
      {
        id: 101,
        author: "Andrea López",
        initials: "AL",
        date: "Sab, 5 de oct. de 2026, 14:32",
        content:
          "Hola a todos, soy Andrea. Actualmente estudio Administración y me gusta aprender sobre herramientas que puedan ayudarme a organizar mejor mis actividades académicas. Espero aprender mucho durante este curso.",
        replies: [
          {
            id: 1001,
            author: "Carlos Pérez",
            initials: "CP",
            date: "Sab, 5 de oct. de 2026, 15:10",
            content:
              "¡Bienvenida Andrea! También espero que podamos aprender bastante durante el curso.",
          },
          {
            id: 1002,
            author: "Luis Gómez",
            initials: "LG",
            date: "Sab, 5 de oct. de 2026, 15:28",
            content:
              "Coincido contigo, Andrea. Las herramientas digitales ayudan bastante a organizar nuestras actividades.",
          },
          {
            id: 1003,
            author: "María Fernanda Torres",
            initials: "MT",
            date: "Sab, 5 de oct. de 2026, 16:02",
            content:
              "@AndreaLópez también estoy estudiando Administración. Espero que podamos compartir experiencias durante el curso.",
          },
          {
            id: 1004,
            author: "José Ramírez",
            initials: "JR",
            date: "Sab, 5 de oct. de 2026, 16:21",
            content:
              "Muchos éxitos, Andrea. Seguro tendremos varias experiencias para compartir.",
          },
        ],
      },
      {
        id: 102,
        author: "María Fernanda Torres",
        initials: "MT",
        date: "Sab, 6 de oct. de 2026, 20:35",
        content:
          "Buenas tardes a todos, mi nombre es María Fernanda Torres y actualmente soy estudiante de Administración. Me considero una persona responsable, organizada y con muchas ganas de seguir aprendiendo. Me interesa conocer nuevas herramientas tecnológicas que puedan ayudarme a mejorar la forma en que realizo mis actividades académicas y personales. Espero que este curso de Herramientas TIC me permita ampliar mis conocimientos, aprender nuevas formas de trabajar con herramientas digitales y desarrollar habilidades que pueda aplicar en futuros proyectos.",
        replies: [],
      },
    ],
  },
  {
    id: "tic",
    title: "Las TIC",
    description:
      "Comparte cómo las TIC forman parte de tu vida diaria y qué beneficios encuentras en ellas.",
    author: "Gloria Rocha",
    initials: "GR",
    repliesCount: 5,
    date: "Lun, 14 de sep. de 2026",
    time: "10:00",
    replies: [],
  },
  {
    id: "productividad",
    title: "Productividad",
    description:
      "¿Qué herramienta digital utilizas para organizar mejor tus actividades y aumentar tu productividad?",
    author: "Gloria Rocha",
    initials: "GR",
    repliesCount: 12,
    date: "Mie, 16 de sep. de 2026",
    time: "12:30",
    replies: [],
  },
  {
    id: "nube",
    title: "Trabajo en la nube",
    description:
      "Comparte una experiencia o ejemplo en el que las herramientas en la nube faciliten el trabajo colaborativo.",
    author: "Gloria Rocha",
    initials: "GR",
    repliesCount: 12,
    date: "Dom, 20 de sep. de 2026",
    time: "19:30",
    replies: [],
  },
];