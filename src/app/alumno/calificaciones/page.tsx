"use client";

import { useState } from "react";

type Evaluacion = {
  evaluacion: string;
  descripcion: string;
  peso: string;
  nota: string;
  estado: "Aprobado" | "Pendiente";
};

type Curso = {
  id: number;
  nombre: string;
  codigo: string;
  promedio: string;
  estado: "Aprobado" | "En curso";
  imagen: string;
  evaluaciones: Evaluacion[];
};

const cursos: Curso[] = [
  {
    id: 1,
    nombre: "Herramientas TIC",
    codigo: "HER001",
    promedio: "16.4/20",
    estado: "Aprobado",
    imagen:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    evaluaciones: [
      {
        evaluacion: "EX1",
        descripcion: "Examen N°1",
        peso: "10%",
        nota: "16",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX2",
        descripcion: "Examen N°2",
        peso: "10%",
        nota: "18",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX3",
        descripcion: "Examen N°3",
        peso: "10%",
        nota: "15",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX4",
        descripcion: "Examen N°4",
        peso: "10%",
        nota: "-",
        estado: "Pendiente",
      },
      {
        evaluacion: "EX5",
        descripcion: "Examen N°5",
        peso: "10%",
        nota: "-",
        estado: "Pendiente",
      },
      {
        evaluacion: "EX6",
        descripcion: "Examen N°6",
        peso: "10%",
        nota: "-",
        estado: "Pendiente",
      },
      {
        evaluacion: "PRO",
        descripcion: "Proyecto Final",
        peso: "40%",
        nota: "-",
        estado: "Pendiente",
      },
    ],
  },

  {
    id: 2,
    nombre: "Programación",
    codigo: "HER002",
    promedio: "15.6/20",
    estado: "En curso",
    imagen:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
    evaluaciones: [
      {
        evaluacion: "EX1",
        descripcion: "Práctica de programación",
        peso: "20%",
        nota: "16",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX2",
        descripcion: "Examen parcial",
        peso: "30%",
        nota: "15",
        estado: "Aprobado",
      },
      {
        evaluacion: "PRO",
        descripcion: "Proyecto Final",
        peso: "50%",
        nota: "-",
        estado: "Pendiente",
      },
    ],
  },

  {
    id: 3,
    nombre: "Psicología",
    codigo: "HER003",
    promedio: "12.7/20",
    estado: "En curso",
    imagen:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
    evaluaciones: [
      {
        evaluacion: "EX1",
        descripcion: "Evaluación 1",
        peso: "30%",
        nota: "13",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX2",
        descripcion: "Evaluación 2",
        peso: "30%",
        nota: "12",
        estado: "Aprobado",
      },
      {
        evaluacion: "PRO",
        descripcion: "Trabajo final",
        peso: "40%",
        nota: "-",
        estado: "Pendiente",
      },
    ],
  },

  {
    id: 4,
    nombre: "Algoritmos",
    codigo: "HER004",
    promedio: "14.8/20",
    estado: "En curso",
    imagen:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    evaluaciones: [
      {
        evaluacion: "EX1",
        descripcion: "Práctica 1",
        peso: "30%",
        nota: "15",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX2",
        descripcion: "Práctica 2",
        peso: "30%",
        nota: "14",
        estado: "Aprobado",
      },
      {
        evaluacion: "PRO",
        descripcion: "Proyecto Final",
        peso: "40%",
        nota: "-",
        estado: "Pendiente",
      },
    ],
  },

  {
    id: 5,
    nombre: "Matemática",
    codigo: "HER005",
    promedio: "14.2/20",
    estado: "En curso",
    imagen:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    evaluaciones: [
      {
        evaluacion: "EX1",
        descripcion: "Examen parcial",
        peso: "30%",
        nota: "14",
        estado: "Aprobado",
      },
      {
        evaluacion: "EX2",
        descripcion: "Práctica calificada",
        peso: "30%",
        nota: "15",
        estado: "Aprobado",
      },
      {
        evaluacion: "PRO",
        descripcion: "Examen final",
        peso: "40%",
        nota: "-",
        estado: "Pendiente",
      },
    ],
  },
];

export default function CalificacionesPage() {
  const [cursoAbierto, setCursoAbierto] = useState<number | null>(1);

  const toggleCurso = (id: number) => {
    setCursoAbierto((actual) => (actual === id ? null : id));
  };

  return (
    <div className="min-h-screen w-full px-[30px] py-[32px] lg:px-[45px]">

      {/* TÍTULO */}
      <header className="mb-[32px]">
        <h1 className="text-[34px] font-semibold tracking-[-0.8px] text-gray-900">
          Mis calificaciones
        </h1>
      </header>

      <div className="w-full">

        {/* ==============================
            RESUMEN SUPERIOR
        ============================== */}

        <section className="mb-[20px] grid w-full grid-cols-1 overflow-hidden rounded-[16px] bg-[#dfe4eb] md:grid-cols-3">

          {/* PROMEDIO GENERAL */}
          <div className="flex min-h-[112px] items-center gap-5 px-7 py-5">

            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[17px] bg-[#e7f2ff] text-[#2c8ee8] shadow-sm">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
              >
                <path
                  d="M5 20V10"
                  strokeLinecap="round"
                />

                <path
                  d="M10 20V5"
                  strokeLinecap="round"
                />

                <path
                  d="M15 20v-7"
                  strokeLinecap="round"
                />

                <path
                  d="M20 20H3"
                  strokeLinecap="round"
                />
              </svg>

            </div>

            <div>

              <p className="text-[16px] font-medium text-gray-700">
                Promedio general
              </p>

              <p className="mt-1 text-[27px] font-bold text-gray-950">
                15.4/20
              </p>

            </div>

          </div>

          {/* CURSOS MATRICULADOS */}
          <div className="flex min-h-[112px] items-center gap-5 border-y border-white/80 px-7 py-5 md:border-x md:border-y-0">

            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[17px] bg-[#dff8f7] text-[#08aeb2] shadow-sm">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
              >

                <path
                  d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

            </div>

            <div>

              <p className="text-[16px] font-medium text-gray-700">
                Cursos matriculados
              </p>

              <p className="mt-1 text-[27px] font-bold text-gray-950">
                5
              </p>

            </div>

          </div>

          {/* PROGRESO GLOBAL */}
          <div className="flex min-h-[112px] items-center gap-5 px-7 py-5">

            <div className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center">

              <svg
                viewBox="0 0 64 64"
                className="absolute inset-0 h-full w-full -rotate-90"
              >

                {/* FONDO */}
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke="#e4e8ee"
                  strokeWidth="6"
                />

                {/* PROGRESO 60% */}
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke="#2c8ee8"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="169.65"
                  strokeDashoffset="67.86"
                />

              </svg>

              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-sm">

                <span className="text-[14px] font-bold text-[#102963]">
                  60%
                </span>

              </div>

            </div>

            <div>

              <p className="text-[16px] font-medium text-gray-700">
                Progreso global
              </p>

              <p className="mt-1 text-[13px] text-gray-500">
                3 de 5 cursos aprobados
              </p>

            </div>

          </div>

        </section>

        {/* ==============================
            CURSOS
        ============================== */}

        <section className="space-y-[18px]">

          {cursos.map((curso) => {

            const abierto = cursoAbierto === curso.id;

            return (
              <article
                key={curso.id}
                className="overflow-hidden rounded-[16px] bg-[#dfe4eb] transition-all duration-200"
              >

                {/* CABECERA */}
                <button
                  type="button"
                  onClick={() => toggleCurso(curso.id)}
                  className="flex w-full items-center justify-between gap-5 px-6 py-[22px] text-left"
                >

                  <div className="flex items-center gap-4">

                    {/* IMAGEN DEL CURSO */}
                    <div className="h-[62px] w-[95px] shrink-0 overflow-hidden rounded-[10px] bg-white">

                      <img
                        src={curso.imagen}
                        alt={curso.nombre}
                        className="h-full w-full object-cover"
                      />

                    </div>

                    <div>

                      <h2 className="text-[19px] font-semibold text-gray-900">
                        {curso.nombre}
                      </h2>

                      <p className="mt-[3px] text-[12px] font-medium text-gray-500">
                        {curso.codigo}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-5">

                    <div className="text-right">

                      <p className="text-[13px] font-medium text-gray-600">
                        Promedio
                      </p>

                      <p className="text-[22px] font-bold text-gray-950">
                        {curso.promedio}
                      </p>

                    </div>

                    <span className="min-w-[95px] rounded-[7px] bg-white px-4 py-[10px] text-center text-[13px] font-medium text-gray-700">
                      {curso.estado}
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                        abierto ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                  </div>

                </button>

                {/* TABLA DESPLEGABLE */}
                {abierto && (

                  <div className="px-6 pb-6">

                    <div className="overflow-x-auto rounded-[10px] bg-white">

                      <table className="w-full min-w-[760px] border-collapse">

                        <thead>

                          <tr className="border-b border-gray-200 bg-[#f5f6f8]">

                            <th className="px-5 py-[12px] text-left text-[13px] font-semibold text-gray-700">
                              Evaluación
                            </th>

                            <th className="px-5 py-[12px] text-left text-[13px] font-semibold text-gray-700">
                              Descripción
                            </th>

                            <th className="px-5 py-[12px] text-center text-[13px] font-semibold text-gray-700">
                              Peso
                            </th>

                            <th className="px-5 py-[12px] text-center text-[13px] font-semibold text-gray-700">
                              Nota
                            </th>

                            <th className="px-5 py-[12px] text-center text-[13px] font-semibold text-gray-700">
                              Estado
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {curso.evaluaciones.map((evaluacion, index) => (

                            <tr
                              key={`${curso.id}-${index}`}
                              className="border-b border-gray-100 last:border-0"
                            >

                              <td className="px-5 py-[11px] text-[13px] text-gray-700">
                                {evaluacion.evaluacion}
                              </td>

                              <td className="px-5 py-[11px] text-[13px] text-gray-700">
                                {evaluacion.descripcion}
                              </td>

                              <td className="px-5 py-[11px] text-center text-[13px] text-gray-700">
                                {evaluacion.peso}
                              </td>

                              <td className="px-5 py-[11px] text-center text-[13px] font-medium text-gray-800">
                                {evaluacion.nota}
                              </td>

                              <td className="px-5 py-[11px] text-center">

                                <span
                                  className={`inline-block min-w-[84px] rounded-full px-3 py-[5px] text-[11px] font-semibold ${
                                    evaluacion.estado === "Aprobado"
                                      ? "bg-[#70ef48] text-green-950"
                                      : "bg-[#fff000] text-yellow-950"
                                  }`}
                                >
                                  {evaluacion.estado}
                                </span>

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}

              </article>
            );
          })}

        </section>

      </div>

    </div>
  );
}