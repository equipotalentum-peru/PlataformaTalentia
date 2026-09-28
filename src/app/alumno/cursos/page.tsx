import Link from "next/link";

const cursos = [
  {
    id: 1,
    nombre: "Herramientas TIC",
    progreso: 20,
    imagen:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    nombre: "Programación",
    progreso: 15,
    imagen:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    nombre: "Psicología",
    progreso: 70,
    imagen:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    nombre: "Algoritmos",
    progreso: 70,
    imagen:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    nombre: "Matemática",
    progreso: 70,
    imagen:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
  },
];

export default function MisCursosPage() {
  return (
    <div className="min-h-screen px-[52px] py-[33px]">

      <header className="mb-[31px]">
        <h1 className="text-[29px] font-semibold tracking-[-0.7px] text-gray-900">
          Mis cursos
        </h1>
      </header>

      <section className="grid max-w-[980px] grid-cols-1 gap-[18px] md:grid-cols-2">

        {cursos.map((curso) => (
          <Link
            key={curso.id}
            href={`/alumno/cursos/${curso.id}`}
            className="group relative block h-[164px] overflow-hidden rounded-[13px] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <img
              src={curso.imagen}
              alt={curso.nombre}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-[16px]">
              <div className="mb-[9px] flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-white">
                  {curso.nombre}
                </h2>

                <span className="text-[14px] font-medium text-white">
                  {curso.progreso}% completado
                </span>
              </div>

              <div className="h-[17px] overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#2c8ee8]"
                  style={{ width: `${curso.progreso}%` }}
                />
              </div>
            </div>
          </Link>
        ))}

      </section>
    </div>
  );
}