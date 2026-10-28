"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

interface CursoApi {
  id: string | number;
  nombre: string;
  codigo: string;
  docente: string;
  cupos: number | string;
  matriculados: number | string;
  estado: string;
}

interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  docente: string;
  matriculas: string;
  estado: "Borrador" | "Activo" | "Inactivo";
}

type ResumenPublicacionTalentia = {
  existePublicacion: boolean;
  estado: "publicado" | "oculto" | null;
  tieneBorrador: boolean;
  documentId: string | null;
};

export default function TablaCursos() {
  
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | "Activos" | "Inactivos" | "Borrador">("Todos");
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [cursoEnAccion, setCursoEnAccion] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estadosPublicacion, setEstadosPublicacion] = useState<Record<string, ResumenPublicacionTalentia>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorEstadoPublicacion, setErrorEstadoPublicacion] = useState("");
  const [mensajePublicacion, setMensajePublicacion] = useState("");
  const referenciasMenus = useRef<Map<string, HTMLTableCellElement>>(new Map());

  // Cierra el menú al hacer clic fuera o pulsar Escape, como en otros paneles administrativos.
  useEffect(() => {
    if (!menuAbierto) return;

    const celdaActiva = referenciasMenus.current.get(menuAbierto);
    const cerrarAlHacerClicFuera = (event: PointerEvent) => {
      const destino = event.target;
      if (celdaActiva && destino instanceof Node && !celdaActiva.contains(destino)) {
        setMenuAbierto(null);
      }
    };
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuAbierto(null);
    };

    document.addEventListener("pointerdown", cerrarAlHacerClicFuera, true);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarAlHacerClicFuera, true);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [menuAbierto]);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          `${API_URL}/administrador/cursos`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "No se pudieron cargar los cursos."
          );
        }

        const lista: CursoApi[] = Array.isArray(data.cursos)
          ? data.cursos.filter(
              (curso: CursoApi) => curso.estado !== "Archivado"
            )
          : [];

        setCursos(
          lista.map((curso) => ({
            id: String(curso.id),
            nombre: curso.nombre,
            codigo: curso.codigo,
            docente: curso.docente || "Sin asignar",
            matriculas: `${Number(curso.matriculados) || 0} / ${
              Number(curso.cupos) || 0
            }`,
            estado: curso.estado === "Activo" ? "Activo" : curso.estado === "Inactivo" ? "Inactivo" : "Borrador",
          }))
        );

        try {
          const estadosResponse = await fetch(
            `${API_URL}/administrador/cursos/publicaciones-talentia/estados`,
            { method: "GET", credentials: "include", signal: controller.signal }
          );
          const estadosData = await estadosResponse.json().catch(() => ({}));
          if (estadosResponse.status === 401) {
            router.push("/login");
            return;
          }
          if (!estadosResponse.ok) {
            throw new Error(
              estadosData.message ?? "No se pudieron consultar las publicaciones de Talentia."
            );
          }
          setEstadosPublicacion(
            estadosData.estados && typeof estadosData.estados === "object"
              ? estadosData.estados as Record<string, ResumenPublicacionTalentia>
              : {}
          );
          setErrorEstadoPublicacion("");
        } catch (statusError) {
          if (controller.signal.aborted) return;
          setErrorEstadoPublicacion(
            statusError instanceof Error
              ? statusError.message
              : "No se pudieron consultar las publicaciones de Talentia."
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los cursos."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarCursos();

    return () => controller.abort();
  }, [router]);
  
  const cambiarEstadoCurso = async (
    curso: Curso,
    nuevoEstado: "Activo" | "Inactivo" | "Archivado"
  ) => {
    const accion =
    nuevoEstado === "Activo"
      ? curso.estado === "Borrador"
        ? "publicar"
        : "activar"
      : nuevoEstado === "Inactivo"
        ? "desactivar"
        : "retirar";

    const mensaje =
      nuevoEstado === "Archivado"
        ? `¿Deseas retirar «${curso.nombre}»? El curso dejará de aparecer en los listados habituales, pero sus registros permanecerán en la base de datos.`
        : `¿Deseas ${accion} «${curso.nombre}»?`;

    if (!window.confirm(mensaje)) return;

    setCursoEnAccion(curso.id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/administrador/cursos/${encodeURIComponent(curso.id)}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ?? "No se pudo cambiar el estado del curso."
        );
      }

      if (nuevoEstado === "Archivado") {
        setCursos((actuales) =>
          actuales.filter((item) => item.id !== curso.id)
        );
      } else {
        setCursos((actuales) =>
          actuales.map((item) =>
            item.id === curso.id
              ? { ...item, estado: nuevoEstado }
              : item
          )
        );
      }

      setMenuAbierto(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del curso."
      );
    } finally {
      setCursoEnAccion(null);
    }
  };

  const gestionarPublicacionTalentia = async (
    curso: Curso,
    accion: "ocultar" | "mostrar" | "eliminar"
  ) => {
    const mensajeConfirmacion = accion === "ocultar"
      ? `¿Deseas ocultar «${curso.nombre}» de la página pública de Talentia? La ficha se conservará en Firebase.`
      : accion === "mostrar"
        ? `¿Deseas volver a mostrar «${curso.nombre}» en la página pública de Talentia?`
        : `¿Deseas eliminar permanentemente la publicación de «${curso.nombre}»? Se borrará el documento de Firebase y cualquier borrador asociado. Esta acción no se puede deshacer.`;

    if (!window.confirm(mensajeConfirmacion)) return;

    setCursoEnAccion(curso.id);
    setErrorEstadoPublicacion("");
    setMensajePublicacion("");

    try {
      const esEliminar = accion === "eliminar";
      const response = await fetch(
        `${API_URL}/administrador/cursos/${encodeURIComponent(curso.id)}/publicacion-talentia${esEliminar ? "" : "/estado"}`,
        {
          method: esEliminar ? "DELETE" : "PATCH",
          credentials: "include",
          headers: esEliminar ? undefined : { "Content-Type": "application/json" },
          body: esEliminar
            ? undefined
            : JSON.stringify({ estado: accion === "ocultar" ? "oculto" : "publicado" }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(
          data.message ?? "No se pudo actualizar la publicación de Talentia."
        );
      }

      if (accion === "eliminar") {
        setEstadosPublicacion((actuales) => {
          const siguientes = { ...actuales };
          delete siguientes[curso.id];
          return siguientes;
        });
      } else {
        setEstadosPublicacion((actuales) => ({
          ...actuales,
          [curso.id]: {
            existePublicacion: true,
            estado: accion === "ocultar" ? "oculto" : "publicado",
            tieneBorrador: actuales[curso.id]?.tieneBorrador ?? false,
            documentId: actuales[curso.id]?.documentId ?? null,
          },
        }));
      }

      setMensajePublicacion(
        data.message ??
          (accion === "ocultar"
            ? "Publicación ocultada."
            : accion === "mostrar"
              ? "Publicación visible."
              : "Publicación eliminada.")
      );
      setMenuAbierto(null);
    } catch (actionError) {
      setErrorEstadoPublicacion(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo actualizar la publicación de Talentia."
      );
    } finally {
      setCursoEnAccion(null);
    }
  };

  // Filtrado por búsqueda y categoría
  const cursosFiltrados = cursos.filter((curso) => {
    const termino = searchTerm.trim().toLowerCase();

    const coincideBusqueda =
      curso.nombre.toLowerCase().includes(termino) ||
      curso.codigo.toLowerCase().includes(termino);

    if (filtroEstado === "Todos") return coincideBusqueda;

    if (filtroEstado === "Activos") {
      return coincideBusqueda && curso.estado === "Activo";
    }

    if (filtroEstado === "Inactivos") {
      return coincideBusqueda && curso.estado === "Inactivo";
    }

    return coincideBusqueda && curso.estado === "Borrador";
  });

  return (
    <div className="w-full space-y-6">
      {/* Encabezado y Botón Crear Curso */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
            Cursos
          </h1>
          <p className="text-sm font-semibold text-talentia-muted mt-1">
            Administración de cursos, docentes, publicación y cupos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/administrador/cursos/crear")}
          className="bg-talentia-action hover:bg-talentia-primary text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-sm self-start sm:self-auto"
        >
          Crear curso
        </button>
      </div>

      {errorEstadoPublicacion && (
        <p role="alert" className="rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-sm font-semibold text-talentia-danger">
          {errorEstadoPublicacion}
        </p>
      )}
      {mensajePublicacion && (
        <p role="status" className="rounded-xl border border-talentia-success/20 bg-talentia-success-bg px-4 py-3 text-sm font-semibold text-talentia-success">
          {mensajePublicacion}
        </p>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-[13px] font-semibold text-talentia-muted">
          Buscar
          <input
            type="text"
            placeholder="Buscar por curso o código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-talentia-border bg-talentia-surface px-4 text-sm font-normal text-talentia-primary placeholder-talentia-placeholder outline-none transition-colors hover:border-talentia-border focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          />
        </label>

        <div className="flex min-w-0 flex-col gap-2 lg:shrink-0">
          <span className="text-[13px] font-semibold text-talentia-muted">Estado</span>
          <div className="flex min-h-11 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroEstado("Todos")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${
              filtroEstado === "Todos"
                ? "bg-talentia-selected text-talentia-primary"
                : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover"
            }`}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("Activos")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${
              filtroEstado === "Activos"
                ? "bg-talentia-selected text-talentia-primary"
                : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover"
            }`}
          >
            Activos
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("Inactivos")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${
              filtroEstado === "Inactivos"
                ? "bg-talentia-selected text-talentia-primary"
                : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover"
            }`}
          >
            Inactivos
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("Borrador")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${
              filtroEstado === "Borrador"
                ? "bg-talentia-selected text-talentia-primary"
                : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover"
            }`}
          >
            Borrador
          </button>
          </div>
        </div>
      </div>

      {/* Tabla de Cursos */}
      <div className="bg-talentia-surface rounded-3xl overflow-hidden shadow-sm border border-talentia-border/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed text-left border-collapse">
            <colgroup>
              <col />
              <col className="w-32" />
              <col className="w-44" />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-24" />
            </colgroup>
            <thead>
              <tr className="bg-talentia-table-header text-talentia-primary text-[13px] font-extrabold border-b border-talentia-border">
                <th className="py-4 px-6">Curso</th>
                <th className="py-4 px-4">Código</th>
                <th className="py-4 px-4">Docente</th>
                <th className="py-4 px-4">Matrículas</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-talentia-border text-[13px] font-semibold text-talentia-muted">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-talentia-muted">
                    Cargando cursos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-talentia-danger"
                  >
                    {error}
                  </td>
                </tr>
              ) : (
                <>
                  {cursosFiltrados.map((curso) => (
                    <tr key={curso.id} className="hover:bg-talentia-hover/50 transition">
                      <td className="py-4 px-6 break-words font-bold text-talentia-primary">{curso.nombre}</td>
                      <td className="py-4 px-4 whitespace-nowrap text-talentia-muted">{curso.codigo}</td>
                      <td className="py-4 px-4 break-words text-talentia-muted">{curso.docente}</td>
                      <td className="py-4 px-4 whitespace-nowrap text-talentia-muted">{curso.matriculas}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-extrabold ${
                            curso.estado === "Activo"
                              ? "bg-talentia-success-bg text-talentia-success"
                              : curso.estado === "Inactivo"
                                ? "bg-talentia-surface text-talentia-muted"
                                : "bg-talentia-purple-soft text-talentia-purple"
                          }`}
                        >
                          {curso.estado}
                        </span>
                      </td>
                      <td
                        ref={(element) => {
                          if (element) referenciasMenus.current.set(curso.id, element);
                          else referenciasMenus.current.delete(curso.id);
                        }}
                        className="relative py-4 px-4 text-center"
                      >
                        <button
                          type="button"
                          aria-label={`Acciones de ${curso.nombre}`}
                          aria-expanded={menuAbierto === curso.id}
                          disabled={cursoEnAccion === curso.id}
                          onClick={() =>
                            setMenuAbierto((actual) =>
                              actual === curso.id ? null : curso.id
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-xl font-bold text-talentia-muted transition hover:bg-talentia-hover disabled:opacity-50"
                        >
                          ⋮
                        </button>

                        {menuAbierto === curso.id && (
                          <div className="absolute right-6 top-14 z-30 min-w-60 rounded-xl border border-talentia-border bg-talentia-surface p-1 text-left shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuAbierto(null);
                                router.push(
                                  `/administrador/cursos/configurar?id=${curso.id}`
                                );
                              }}
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover"
                            >
                              Editar en la Plataforma Talentia
                            </button>

                             {curso.estado === "Activo" && (
                              <button
                                type="button"
                                disabled={cursoEnAccion === curso.id}
                                onClick={() =>
                                  void cambiarEstadoCurso(curso, "Inactivo")
                                }
                                className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-muted hover:bg-talentia-hover disabled:opacity-50"
                              >
                                Desactivar en la Plataforma Talentia
                              </button>
                            )}

                            {curso.estado === "Inactivo" && (
                              <button
                                type="button"
                                disabled={cursoEnAccion === curso.id}
                                onClick={() =>
                                  void cambiarEstadoCurso(curso, "Activo")
                                }
                                className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-success hover:bg-talentia-success-bg disabled:opacity-50"
                              >
                                Activar en la Plataforma Talentia
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={cursoEnAccion === curso.id}
                              onClick={() =>
                                void cambiarEstadoCurso(curso, "Archivado")
                              }
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-danger hover:bg-talentia-danger-bg disabled:opacity-50"
                            >
                              Retirar en la Plataforma Talentia
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(errorEstadoPublicacion && !estadosPublicacion[curso.id])}
                              onClick={() => {
                                if (errorEstadoPublicacion && !estadosPublicacion[curso.id]) return;
                                setMenuAbierto(null);
                                router.push(
                                  `/administrador/cursos/publicar?id=${encodeURIComponent(curso.id)}`
                                );
                              }}
                              title={errorEstadoPublicacion && !estadosPublicacion[curso.id] ? "No se pudo consultar el estado de la publicación. Actualiza la página después de corregir la conexión con Firebase." : undefined}
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-blue hover:bg-talentia-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {errorEstadoPublicacion && !estadosPublicacion[curso.id]
                                ? "Estado de publicación no disponible"
                                : estadosPublicacion[curso.id]?.existePublicacion
                                  ? "Editar publicación en la Página Talentia"
                                  : estadosPublicacion[curso.id]?.tieneBorrador
                                    ? "Publicar el borrador en la Página Talentia"
                                    : "Publicar en la Página Talentia"}
                            </button>

                            {estadosPublicacion[curso.id]?.existePublicacion &&
                              estadosPublicacion[curso.id]?.estado === "publicado" && (
                                <button
                                  type="button"
                                  disabled={cursoEnAccion === curso.id}
                                  onClick={() => void gestionarPublicacionTalentia(curso, "ocultar")}
                                  className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-muted hover:bg-talentia-hover disabled:opacity-50"
                                >
                                  {cursoEnAccion === curso.id ? "Procesando…" : "Ocultar publicación en la Página Talentia"}
                                </button>
                              )}

                            {estadosPublicacion[curso.id]?.existePublicacion &&
                              estadosPublicacion[curso.id]?.estado !== "publicado" && (
                                <button
                                  type="button"
                                  disabled={cursoEnAccion === curso.id}
                                  onClick={() => void gestionarPublicacionTalentia(curso, "mostrar")}
                                  className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-success hover:bg-talentia-success-bg disabled:opacity-50"
                                >
                                  {cursoEnAccion === curso.id ? "Procesando…" : "Mostrar publicación en la Página Talentia"}
                                </button>
                              )}

                            {estadosPublicacion[curso.id]?.existePublicacion && (
                              <button
                                type="button"
                                disabled={cursoEnAccion === curso.id}
                                onClick={() => void gestionarPublicacionTalentia(curso, "eliminar")}
                                className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-danger hover:bg-talentia-danger-bg disabled:opacity-50"
                              >
                                {cursoEnAccion === curso.id ? "Procesando…" : "Eliminar publicación en la Página Talentia"}
                              </button>
                            )}

                            {curso.estado === "Borrador" && (
                              <button
                                type="button"
                                disabled={cursoEnAccion === curso.id}
                                onClick={() => void cambiarEstadoCurso(curso, "Activo")}
                                className="block w-full rounded-lg px-4 py-2.5 text-left text-[13px] font-semibold text-talentia-success hover:bg-talentia-success-bg disabled:opacity-50"
                              >
                                {cursoEnAccion === curso.id ? "Publicando..." : "Publicar"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {cursosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-talentia-muted text-[13px]">
                        No se encontraron cursos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
