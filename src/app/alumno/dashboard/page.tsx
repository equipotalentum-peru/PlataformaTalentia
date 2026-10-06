"use client";



import Link from "next/link";



import {

  useEffect,

  useState,

} from "react";



import {

  useRouter,

} from "next/navigation";



import {

  API_URL,

} from "@/lib/api";



type CursoDashboard = {

  id: number;

  nombre: string;

  codigo: string;

  imagen: string | null;

  progreso: number;

};



type EventoDashboard = {

  tipo: string;

  titulo: string;

  curso: string;

  codigo: string;

  fecha: string;

};



type AnuncioDashboard = {

  id: number;

  curso_id: number;

  codigo: string;

  titulo: string;

  fecha: string;

};



type DashboardData = {

  resumen: {

    cursosInscritos: number;

    tareasPendientes: number;

    mensajesNoLeidos: number;



    promedioGeneral:

      | number

      | null;

  };



  cursos: CursoDashboard[];



  eventos:

    EventoDashboard[];



  anuncios:

    AnuncioDashboard[];

};



const IMAGEN_POR_DEFECTO =

  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80";



function formatearFecha(

  fecha: string

) {

  const valor =

    new Date(fecha);



  if (

    Number.isNaN(

      valor.getTime()

    )

  ) {

    return "";

  }



  return new Intl.DateTimeFormat(

    "es-PE",

    {

      day: "2-digit",

      month: "short",

      year: "numeric",

    }

  ).format(valor);

}



function estiloEvento(

  tipo: string

) {

  if (

    tipo === "Evaluación"

  ) {

    return "bg-[#fde4ea] text-[#d74b70]";

  }



  return "bg-[#e7f4ff] text-[#2d7fe0]";

}



export default function DashboardPage() {

  const router =

    useRouter();



  const [

    datos,

    setDatos,

  ] =

    useState<

      DashboardData | null

    >(null);



  const [

    cargando,

    setCargando,

  ] =

    useState(true);



  const [

    error,

    setError,

  ] =

    useState("");



  useEffect(() => {

    const controller =

      new AbortController();



    async function cargarDashboard() {

      try {

        setCargando(true);

        setError("");



        const response =

          await fetch(

            `${API_URL}/dashboard/estudiante`,

            {

              method:

                "GET",



              credentials:

                "include",



              signal:

                controller.signal,

            }

          );



        const data =

          await response.json();



        if (

          response.status ===

          401

        ) {

          router.push(

            "/login"

          );



          return;

        }



        if (!response.ok) {

          throw new Error(

            data.message ??

              "No se pudo cargar el dashboard."

          );

        }



        setDatos(data);



      } catch (error) {

        if (

          controller.signal

            .aborted

        ) {

          return;

        }



        setError(

          error instanceof Error

            ? error.message

            : "No se pudo cargar el dashboard."

        );



      } finally {

        if (

          !controller.signal

            .aborted

        ) {

          setCargando(false);

        }

      }

    }



    void cargarDashboard();



    return () =>

      controller.abort();



  }, [router]);



  const resumen = [

    {

      titulo:

        "Cursos inscritos",



      valor:

        String(

          datos?.resumen

            .cursosInscritos ??

            0

        ),



      icono: (

        <svg

          viewBox="0 0 24 24"

          fill="none"

          stroke="currentColor"

          strokeWidth="2"

          className="h-8 w-8"

        >

          <rect

            x="5"

            y="3"

            width="14"

            height="18"

            rx="2"

          />



          <path d="M8 7h8" />

          <path d="M8 11h8" />

        </svg>

      ),

    },



    {

      titulo:

        "Tareas pendientes",



      valor:

        String(

          datos?.resumen

            .tareasPendientes ??

            0

        ),



      icono: (

        <svg

          viewBox="0 0 24 24"

          fill="none"

          stroke="currentColor"

          strokeWidth="2"

          className="h-8 w-8"

        >

          <rect

            x="4"

            y="3"

            width="16"

            height="18"

            rx="2"

          />



          <path d="M8 8h8" />

          <path d="M8 12h8" />

          <path d="M8 16h5" />

        </svg>

      ),

    },



    {

      titulo:

        "Mensajes no leídos",



      valor:

        String(

          datos?.resumen

            .mensajesNoLeidos ??

            0

        ),



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

      titulo:

        "Promedio general",



      valor:

        datos?.resumen

          .promedioGeneral ===

          null ||

        datos?.resumen

          .promedioGeneral ===

          undefined

          ? "--"

          : Number(

              datos.resumen

                .promedioGeneral

            ).toFixed(1),



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



  const estilosResumen = [

    {

      borde:

        "border-[#cfe6ff]",



      icono:

        "bg-[#e9f4ff] text-[#2d97e8]",



      numero:

        "text-[#2d97e8]",



      acento:

        "bg-[#2d97e8]",

    },



    {

      borde:

        "border-[#d8f3ef]",



      icono:

        "bg-[#e5f9f6] text-[#13a89e]",



      numero:

        "text-[#13a89e]",



      acento:

        "bg-[#13a89e]",

    },



    {

      borde:

        "border-[#e9ddff]",



      icono:

        "bg-[#f1eaff] text-[#8b5cf6]",



      numero:

        "text-[#8b5cf6]",



      acento:

        "bg-[#8b5cf6]",

    },



    {

      borde:

        "border-[#ffe5c2]",



      icono:

        "bg-[#fff3df] text-[#f59e0b]",



      numero:

        "text-[#f59e0b]",



      acento:

        "bg-[#f59e0b]",

    },

  ];



  const cursos =

    datos?.cursos ?? [];



  const eventos =

    datos?.eventos ?? [];



  const anuncios =

    datos?.anuncios ?? [];



  if (cargando) {

    return (

      <div className="min-h-screen w-full px-[30px] py-[28px] lg:px-[45px]">



        <h1 className="text-[34px] font-semibold text-gray-950">

          Dashboard del estudiante

        </h1>



        <p className="mt-8 text-[14px] text-gray-500">

          Cargando dashboard...

        </p>



      </div>

    );

  }



  if (error) {

    return (

      <div className="min-h-screen w-full px-[30px] py-[28px] lg:px-[45px]">



        <h1 className="text-[34px] font-semibold text-gray-950">

          Dashboard del estudiante

        </h1>



        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-700">

          {error}

        </div>



      </div>

    );

  }



  return (

    <div className="min-h-screen w-full px-[30px] py-[28px] lg:px-[45px]">



      <header className="mb-7">

        <h1 className="text-[34px] font-semibold tracking-[-0.8px] text-gray-950">

          Dashboard del estudiante

        </h1>

      </header>



      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">



        {resumen.map(

          (

            item,

            index

          ) => {

            const estilo =

              estilosResumen[

                index

              ];



            return (

              <article

                key={

                  item.titulo

                }

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



                <div

                  className={`absolute left-0 top-0 h-[5px] w-full ${estilo.acento}`}

                />



                <div className="flex h-full items-center gap-5">



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

                    {

                      item.icono

                    }

                  </div>



                  <div>

                    <p

                      className={`text-[36px] font-bold leading-none ${estilo.numero}`}

                    >

                      {

                        item.valor

                      }

                    </p>



                    <p className="mt-2 text-[14px] font-semibold text-gray-700">

                      {

                        item.titulo

                      }

                    </p>

                  </div>



                </div>



              </article>

            );

          }

        )}



      </section>



      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">



        <div>



          <section>

            <h2 className="mb-3 text-[22px] font-semibold text-[#2d7fe0]">

              Próximos eventos

            </h2>



            <div className="space-y-3">



              {eventos.length ===

              0 ? (



                <div className="rounded-[13px] border border-gray-200 bg-white px-4 py-7 text-center shadow-sm">



                  <p className="text-[13px] text-gray-500">

                    No hay próximos eventos.

                  </p>



                </div>



              ) : (



                eventos.map(

                  (

                    evento,

                    index

                  ) => (



                    <article

                      key={`${evento.codigo}-${evento.fecha}-${index}`}

                      className="grid grid-cols-[1fr_auto] items-center rounded-[13px] border border-gray-200 bg-white px-4 py-3 shadow-sm"

                    >



                      <div>



                        <span

                          className={`inline-block rounded-full px-3 py-1 text-[11px] font-medium ${estiloEvento(

                            evento.tipo

                          )}`}

                        >

                          {

                            evento.tipo

                          }

                        </span>



                        <p className="mt-2 text-[15px] font-medium text-[#1e73d8]">

                          {

                            evento.titulo

                          }

                        </p>



                        <p className="mt-1 text-[12px] text-gray-500">

                          {

                            evento.curso

                          }

                        </p>



                      </div>



                      <div className="ml-5 flex items-center gap-5 border-l border-[#a7c9f0] pl-5">



                        <div className="text-right">



                          <p className="text-[10px] text-gray-500">

                            {

                              evento.codigo

                            }

                          </p>



                          <div className="mt-2 flex items-center gap-2">



                            <svg

                              viewBox="0 0 24 24"

                              fill="none"

                              stroke="currentColor"

                              strokeWidth="1.8"

                              className="h-5 w-5 text-[#2d97e8]"

                            >

                              <rect

                                x="3"

                                y="5"

                                width="18"

                                height="16"

                                rx="2"

                              />



                              <path d="M8 3v4" />

                              <path d="M16 3v4" />

                              <path d="M3 10h18" />

                            </svg>



                            <span className="text-[14px] font-medium text-gray-700">

                              {formatearFecha(

                                evento.fecha

                              )}

                            </span>



                          </div>



                        </div>



                      </div>



                    </article>

                  )

                )



              )}



            </div>

          </section>



          <section className="mt-6">



            <h2 className="mb-3 text-[22px] font-semibold text-[#2d7fe0]">

              Anuncios

            </h2>



            <div className="space-y-3">



              {anuncios.length ===

              0 ? (



                <div className="rounded-[13px] border border-gray-200 bg-white px-4 py-7 text-center shadow-sm">



                  <p className="text-[13px] text-gray-500">

                    No hay anuncios recientes.

                  </p>



                </div>



              ) : (



                anuncios.map(

                  (anuncio) => (



                    <Link

                      key={

                        anuncio.id

                      }

                      href={`/alumno/cursos/${anuncio.curso_id}/anuncios`}

                      className="block rounded-[13px] border border-gray-200 bg-white px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#9bc8f2] hover:shadow-md"

                    >



                      <p className="text-[10px] text-gray-400">

                        {

                          anuncio.codigo

                        }

                      </p>



                      <div className="mt-2 flex items-center justify-between gap-4">

                        <p className="text-[15px] font-medium text-[#1e73d8]">

                          {

                            anuncio.titulo

                          }

                        </p>



                        <svg

                          className="h-4 w-4 shrink-0 text-[#2d97e8]"

                          viewBox="0 0 24 24"

                          fill="none"

                          stroke="currentColor"

                          strokeWidth="2"

                          aria-hidden="true"

                        >

                          <path d="m9 18 6-6-6-6" />

                        </svg>

                      </div>



                      <p className="mt-2 text-[10px] text-gray-500">

                        {formatearFecha(

                          anuncio.fecha

                        )}

                      </p>



                    </Link>

                  )

                )



              )}



            </div>



          </section>



        </div>



        <aside>



          <h2 className="mb-3 text-[22px] font-semibold text-[#2d7fe0]">

            Mis cursos

          </h2>



          <div className="space-y-3">



            {cursos.length ===

            0 ? (



              <div className="rounded-[13px] border border-gray-200 bg-white px-4 py-7 text-center shadow-sm">



                <p className="text-[13px] text-gray-500">

                  No tienes cursos matriculados.

                </p>



              </div>



            ) : (



              cursos.map(

                (curso) => (



                  <Link

                    key={

                      curso.id

                    }

                    href={`/alumno/cursos/${curso.id}`}

                    className="block rounded-[13px] border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"

                  >



                    <div className="flex gap-3">



                      <img

                        src={

                          curso.imagen ||

                          IMAGEN_POR_DEFECTO

                        }

                        alt={

                          curso.nombre

                        }

                        className="h-[68px] w-[92px] shrink-0 rounded-[9px] object-cover"

                      />



                      <div className="min-w-0 flex-1">



                        <div className="flex items-start justify-between gap-3">



                          <p className="truncate text-[14px] font-medium text-gray-800">

                            {

                              curso.nombre

                            }

                          </p>



                          <span className="text-[9px] text-gray-500">

                            {

                              curso.codigo

                            }

                          </span>



                        </div>



                        <div className="mt-4">



                          <div className="h-[7px] overflow-hidden rounded-full bg-gray-200">



                            <div

                              className="h-full rounded-full bg-[#2d8fe7]"

                              style={{

                                width: `${Math.min(

                                  100,

                                  Math.max(

                                    0,

                                    curso.progreso

                                  )

                                )}%`,

                              }}

                            />



                          </div>



                          <p className="mt-1 text-[10px] text-gray-500">

                            {

                              curso.progreso

                            }

                            % completado

                          </p>



                        </div>



                      </div>



                    </div>



                  </Link>

                )

              )



            )}



          </div>



        </aside>



      </div>



    </div>

  );

}