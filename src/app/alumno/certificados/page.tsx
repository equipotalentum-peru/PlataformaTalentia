"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import CertificateDownloadButton
  from "@/components/alumno/certificados/CertificateDownloadButton";

import {
  API_URL,
} from "@/lib/api";
import {
  resolverImagenPortadaCurso,
} from "@/lib/curso-imagen";



type Certificado = {
  id: number;
  cursoId: number;
  curso: string;
  codigo: string;
  fecha: string;
  estado: "Completado";
  imagen: string;
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

function formatearFecha(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone:
        "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

export default function CertificadosPage() {
const [
  certificados,
  setCertificados,
] =
  useState<
    Certificado[]
  >([]);

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

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("todos");

  useEffect(() => {
  const controller =
    new AbortController();

  async function cargarCertificados() {
    try {
      setCargando(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/certificados`,
          {
            credentials:
              "include",

            signal:
              controller.signal,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ??
            "No se pudieron cargar los certificados."
        );
      }

      const resultado:
        Certificado[] =
        Array.isArray(
          data.certificados
        )
          ? data.certificados.map(
              (
                item: {
                  id: number;
                  cursoId: number | string;
                  curso: string;
                  codigoCurso: string;
                  emitidoEn: string;
                  imagen:
                    | string
                    | null;
                }
              ) => ({
                id:
                  Number(
                    item.id
                  ),

                cursoId:
                  Number(
                    item.cursoId
                  ),

                curso:
                  item.curso,

                codigo:
                  item.codigoCurso,

                fecha:
                  formatearFecha(
                    item.emitidoEn
                  ),

                estado:
                  "Completado",

                imagen:
                  item.imagen ||
                  IMAGEN_POR_DEFECTO,
              })
            )
          : [];

      setCertificados(
        resultado
      );

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
          : "No se pudieron cargar los certificados."
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

  void cargarCertificados();

  return () =>
    controller.abort();

}, []);

  const certificadosFiltrados = useMemo(() => {
    let resultado = certificados.filter((certificado) =>
      certificado.curso
        .toLowerCase()
        .includes(busqueda.toLowerCase().trim())
    );

    if (orden === "nombre") {
      resultado = [...resultado].sort((a, b) =>
        a.curso.localeCompare(b.curso)
      );
    }

    return resultado;
  }, [certificados, busqueda, orden]);

  return (
    <div className="min-h-screen w-full px-[30px] py-[32px] lg:px-[45px]">
      {/* TÍTULO */}
      <header className="mb-[30px]">
        <h1 className="student-page-title text-[34px] font-semibold tracking-[-0.8px] text-talentia-primary">
          Mis certificados
        </h1>
      </header>

      {/* FILTROS */}
      <section className="mb-7 grid w-full max-w-[680px] grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-talentia-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre"
            className="h-10 w-full rounded-[8px] border border-talentia-border bg-talentia-surface pl-10 pr-3 text-[14px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/10"
          />
        </div>

        <select
          value={orden}
          onChange={(event) => setOrden(event.target.value)}
          className="h-10 min-w-0 rounded-[8px] border border-talentia-border bg-talentia-surface px-3 text-[14px] text-talentia-primary outline-none"
        >
          <option value="todos">Todos</option>
          <option value="nombre">Ordenar por nombre</option>
        </select>
      </section>

      {/* CERTIFICADOS */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {certificadosFiltrados.map((certificado) => (
          <article
            key={certificado.id}
            className="overflow-hidden rounded-[16px] border border-talentia-border bg-talentia-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            {/* IMAGEN */}
            <div className="relative h-[165px] overflow-hidden">
              <img
                src={resolverImagenPortadaCurso(
                  certificado.imagen,
                  certificado.cursoId,
                  IMAGEN_POR_DEFECTO
                )}
                alt={certificado.curso}
                onError={(event) => {
                  const elemento = event.currentTarget;

                  if (elemento.src !== IMAGEN_POR_DEFECTO) {
                    elemento.src = IMAGEN_POR_DEFECTO;
                  }
                }}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              <span className="absolute left-4 top-4 rounded-full bg-talentia-success-bg px-3 py-1.5 text-[12px] font-semibold text-talentia-success shadow-sm">
                {certificado.estado}
              </span>
            </div>

            {/* INFO */}
            <div className="p-5">
              <p className="text-[12px] font-medium uppercase tracking-[0.5px] text-talentia-muted">
                Curso
              </p>

              <h2 className="mt-1 text-[20px] font-semibold text-talentia-primary">
                {certificado.curso}
              </h2>

              <div className="mt-4 flex items-center justify-between text-[13px] text-talentia-muted">
                <span>{certificado.codigo}</span>
                <span>{certificado.fecha}</span>
              </div>

              {/* BOTONES */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href={`/alumno/certificados/${certificado.id}`}
                  className="flex h-[44px] items-center justify-center gap-2 rounded-[8px] border border-talentia-blue text-[13px] font-semibold text-talentia-blue transition hover:bg-talentia-hover"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>

                  Ver
                </Link>

               <CertificateDownloadButton
  certificadoId={
    certificado.id
  }

  fileName={
    `certificado-${certificado.codigo}.pdf`
  }

  className="flex h-[44px] items-center justify-center gap-2 rounded-[8px] bg-talentia-action text-[13px] font-semibold text-white transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-60"
/>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* SIN RESULTADOS */}
      {certificadosFiltrados.length === 0 && (
        <div className="mt-10 rounded-[14px] border border-dashed border-talentia-border bg-talentia-surface px-6 py-14 text-center">
          <p className="text-[16px] font-medium text-talentia-primary">
            No se encontraron certificados.
          </p>

          <p className="mt-2 text-[13px] text-talentia-muted">
            Prueba buscando otro curso.
          </p>
        </div>
      )}

      {/* PAGINACIÓN */}
      <div className="mt-8 flex justify-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-talentia-action text-white">
          ‹
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-talentia-action text-white">
          1
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-talentia-action text-white">
          ›
        </button>
      </div>
    </div>
  );
}

