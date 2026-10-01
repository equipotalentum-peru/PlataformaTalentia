const resumen = [
  {
    titulo: "Cursos inscritos",
    valor: "5",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-8 w-8"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
      </svg>
    ),
  },
  {
    titulo: "Tareas pendientes",
    valor: "3",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-8 w-8"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    titulo: "Mensajes no leídos",
    valor: "5",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-8 w-8"
      >
        <path d="M4 5h16v11H8l-4 4V5Z" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </svg>
    ),
  },
  {
    titulo: "Promedio general",
    valor: "15.4",
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-8 w-8"
      >
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 12v5l5 3 5-3v-5" />
      </svg>
    ),
  },
];

const eventos = [
  {
    tipo: "Examen",
    titulo: "Examen parcial: Algoritmos de ordenación",
    curso: "Algoritmos",
    codigo: "ALG0001",
    fecha: "Sep 7, 2026",
    estilo: "bg-[#fde4ea] text-[#d74b70]",
  },
  {
    tipo: "Revisión",
    titulo: "Revisión de la documentación de la API",
    curso: "Herramientas TIC",
    codigo: "HER001",
    fecha: "Sep 12, 2026",
    estilo: "bg-[#edf7d9] text-[#6f9c2f]",
  },
  {
    tipo: "Examen",
    titulo: "Práctica: Autoestima",
    curso: "Psicología",
    codigo: "PSI001",
    fecha: "Sep 15, 2026",
    estilo: "bg-[#fde4ea] text-[#d74b70]",
  },
];

const anuncios = [
  {
    codigo: "ALG0001",
    titulo:
      "Se publicó la rúbrica del Laboratorio 5; consúltela en la página de Tareas",
    fecha: "Hoy, 9:12 a. m.",
  },
  {
    codigo: "PSI001",
    titulo:
      "Conferencia invitada el viernes a las 2 p. m. - Alicia Mora",
    fecha: "Hoy, 10:00 a. m.",
  },
];

const cursos = [
  {
    nombre: "Herramientas TIC",
    codigo: "HER001",
    progreso: 45,
    imagen:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  },
  {
    nombre: "Psicología",
    codigo: "PSI001",
    progreso: 60,
    imagen:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
  },
  {
    nombre: "Matemáticas",
    codigo: "MAT001",
    progreso: 60,
    imagen:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
  },
  {
    nombre: "Programación",
    codigo: "PRO001",
    progreso: 15,
    imagen:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80",
  },
  {
    nombre: "Algoritmos",
    codigo: "ALG0001",
    progreso: 5,
    imagen:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
  },
];

export default function DashboardPage() {
  const estilosResumen = [
    {
      borde: "border-[#cfe6ff]",
      icono: "bg-[#e9f4ff] text-[#2d97e8]",
      numero: "text-[#2d97e8]",
      acento: "bg-[#2d97e8]",
    },
    {
      borde: "border-[#d8f3ef]",
      icono: "bg-[#e5f9f6] text-[#13a89e]",
      numero: "text-[#13a89e]",
      acento: "bg-[#13a89e]",
    },
    {
      borde: "border-[#e9ddff]",
      icono: "bg-[#f1eaff] text-[#8b5cf6]",
      numero: "text-[#8b5cf6]",
      acento: "bg-[#8b5cf6]",
    },
    {
      borde: "border-[#ffe5c2]",
      icono: "bg-[#fff3df] text-[#f59e0b]",
      numero: "text-[#f59e0b]",
      acento: "bg-[#f59e0b]",
    },
  ];

  return (
    <div className="min-h-screen w-full px-[30px] py-[28px] lg:px-[45px]">

      {/* ENCABEZADO */}
      <header className="mb-7">
        <h1 className="text-[34px] font-semibold tracking-[-0.8px] text-gray-950">
          Dashboard del estudiante
        </h1>
      </header>

      {/* TARJETAS RESUMEN */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {resumen.map((item, index) => {
          const estilo = estilosResumen[index];

          return (
            <article
              key={item.titulo}
              className={`
                relative
                min-h-[118px]
                overflow-hidden
                rounded-[18px]
                border
                ${estilo.borde}
                bg-white
                px-6
                py-5
                shadow-sm
                transition
                duration-200
                hover:-translate-y-1
                hover:shadow-lg
              `}
            >
              {/* ACENTO SUPERIOR */}
              <div
                className={`absolute left-0 top-0 h-[5px] w-full ${estilo.acento}`}
              />

              <div className="flex h-full items-center gap-5">

                {/* ICONO */}
                <div
                  className={`
                    flex
                    h-[62px]
                    w-[62px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[18px]
                    ${estilo.icono}
                  `}
                >
                  {item.icono}
                </div>

                {/* TEXTO */}
                <div>
                  <p
                    className={`text-[36px] font-bold leading-none ${estilo.numero}`}
                  >
                    {item.valor}
                  </p>

                  <p className="mt-2 text-[14px] font-semibold text-gray-700">
                    {item.titulo}
                  </p>
                </div>

              </div>
            </article>
          );
        })}
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">

        {/* COLUMNA IZQUIERDA */}
        <div>

          {/* PRÓXIMOS EVENTOS */}
          <section>
            <h2 className="mb-3 text-[22px] font-semibold text-[#2d7fe0]">
              Próximos eventos
            </h2>

            <div className="space-y-3">
              {eventos.map((evento, index) => (
                <article
                  key={index}
                  className="grid grid-cols-[1fr_auto] items-center rounded-[13px] border border-gray-200 bg-white px-4 py-3 shadow-sm"
                >

                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-medium ${evento.estilo}`}
                    >
                      {evento.tipo}
                    </span>

                    <p className="mt-2 text-[15px] font-medium text-[#1e73d8]">
                      {evento.titulo}
                    </p>

                    <p className="mt-1 text-[12px] text-gray-500">
                      {evento.curso}
                    </p>
                  </div>

                  <div className="ml-5 flex items-center gap-5 border-l border-[#a7c9f0] pl-5">
                    <div className="text-right">

                      <p className="text-[10px] text-gray-500">
                        {evento.codigo}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5 text-[#2d97e8]"
                        >
                          <rect x="3" y="5" width="18" height="16" rx="2" />
                          <path d="M8 3v4" />
                          <path d="M16 3v4" />
                          <path d="M3 10h18" />
                        </svg>

                        <span className="text-[14px] font-medium text-gray-700">
                          {evento.fecha}
                        </span>
                      </div>

                    </div>
                  </div>

                </article>
              ))}
            </div>
          </section>

          {/* ANUNCIOS */}
          <section className="mt-6">

            <h2 className="mb-3 text-[22px] font-semibold text-[#2d7fe0]">
              Anuncios
            </h2>

            <div className="space-y-3">
              {anuncios.map((anuncio, index) => (
                <article
                  key={index}
                  className="rounded-[13px] border border-gray-200 bg-white px-4 py-4 shadow-sm"
                >

                  <p className="text-[10px] text-gray-400">
                    {anuncio.codigo}
                  </p>

                  <p className="mt-2 text-[15px] font-medium text-[#1e73d8]">
                    {anuncio.titulo}
                  </p>

                  <p className="mt-2 text-[10px] text-gray-500">
                    {anuncio.fecha}
                  </p>

                </article>
              ))}
            </div>

          </section>

        </div>

        {/* COLUMNA DERECHA */}
        <aside>

          <h2 className="mb-3 text-[22px] font-semibold text-[#2d7fe0]">
            Mis cursos
          </h2>

          <div className="space-y-3">
            {cursos.map((curso) => (
              <article
                key={curso.codigo}
                className="rounded-[13px] border border-gray-200 bg-white p-3 shadow-sm"
              >

                <div className="flex gap-3">

                  <img
                    src={curso.imagen}
                    alt={curso.nombre}
                    className="h-[68px] w-[92px] shrink-0 rounded-[9px] object-cover"
                  />

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <p className="truncate text-[14px] font-medium text-gray-800">
                        {curso.nombre}
                      </p>

                      <span className="text-[9px] text-gray-500">
                        {curso.codigo}
                      </span>

                    </div>

                    <div className="mt-4">

                      <div className="h-[7px] overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#2d8fe7]"
                          style={{
                            width: `${curso.progreso}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-[10px] text-gray-500">
                        {curso.progreso}% completado
                      </p>

                    </div>

                  </div>

                </div>

              </article>
            ))}
          </div>

        </aside>

      </div>

    </div>
  );
}
