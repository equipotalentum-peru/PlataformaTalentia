"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import { aplicarEstilosExcelTalentia } from "@/lib/excel-talentia-format";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";



import { db } from "../../lib/firebase";


type EstadoSolicitud = "Pendiente" | "Contactado" | "Matriculado" | "Cancelado";

interface DatosEmpresa {
  ruc: string;
  nombreEmpresa: string;
  nombreContacto: string;
  correoCorporativo: string;
  telefono: string;
}

interface SolicitudPersona {
  id: string;
  fecha: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  tipoAlumno: "Convenio" | "Externo";
  empresa?: string;
  datosEmpresa?: DatosEmpresa; // Información detallada de la empresa
  interes: string;
  estado: EstadoSolicitud;
}

export default function TablaSolicitudesPersonas() {
 const [solicitudes, setSolicitudes] = useState<SolicitudPersona[]>([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState("");
 const [
  modalCorreoEnviado,
  setModalCorreoEnviado,
] = useState(false);

const [
  correoEnviadoA,
  setCorreoEnviadoA,
] = useState("");

 useEffect(() => {
  async function cargarSolicitudes() {
    try {
      setCargando(true);

      const consulta = query(
        collection(db, "FormularioAlumno"),
        orderBy("fecha_registro", "desc")
      );

      const snapshot = await getDocs(consulta);

      let estadosPorCorreo = new Map<string, EstadoSolicitud>();

      try {
        const responseEstados = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/registration-statuses`
        );

        if (responseEstados.ok) {
          const dataEstados = await responseEstados.json();

          estadosPorCorreo = new Map<string, EstadoSolicitud>(
            (dataEstados.statuses || []).map(
              (registro: { email: string; estado: EstadoSolicitud }) => [
                registro.email.toLowerCase(),
                registro.estado,
              ]
            )
          );
        }
      } catch (error) {
        console.warn(
          "No se pudieron consultar los estados de registro:",
          error
        );
      }

      const sincronizaciones: Promise<unknown>[] = [];

      const datos: SolicitudPersona[] = snapshot.docs.map((documento) => {
        const data = documento.data();

        let fecha = "Sin fecha";

        if (data.fecha_registro?.toDate) {
          fecha = data.fecha_registro
            .toDate()
            .toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
        }

        const estadoFirebase: EstadoSolicitud | null =
          data.estado === "Pendiente" ||
          data.estado === "Contactado" ||
          data.estado === "Matriculado" ||
          data.estado === "Cancelado"
            ? data.estado
            : null;

        const estadoBackend = estadosPorCorreo.get(
          String(data.email || "").toLowerCase()
        );

        const estado: EstadoSolicitud =
          estadoBackend === "Matriculado"
            ? "Matriculado"
            : estadoFirebase || estadoBackend || "Pendiente";

        if (
          estadoBackend === "Matriculado" &&
          estadoFirebase !== "Matriculado"
        ) {
          sincronizaciones.push(
            updateDoc(
              doc(db, "FormularioAlumno", documento.id),
              {
                estado: "Matriculado",
              }
            )
          );
        }

        const datosEmpresaRaw =
          data.datos_empresa &&
          typeof data.datos_empresa === "object"
            ? data.datos_empresa
            : {};

        const datosEmpresa: DatosEmpresa = {
          ruc: String(datosEmpresaRaw.ruc || ""),
          nombreEmpresa: String(datosEmpresaRaw.nombreEmpresa || ""),
          nombreContacto: String(datosEmpresaRaw.nombreContacto || ""),
          correoCorporativo: String(
            datosEmpresaRaw.correoCorporativo || ""
          ),
          telefono: String(datosEmpresaRaw.telefono || ""),
        };

        const tieneDatosEmpresa = Object.values(datosEmpresa).some(
          (valor) => valor.trim().length > 0
        );

        return {
          id: documento.id,
          fecha,
          nombre: data.nombre || "",
          dni: data.dni || "",
          email: data.email || "",
          telefono: data.telefono || "",
          tipoAlumno:
            data.tipo_alumno === "Alumno convenio"
              ? "Convenio"
              : "Externo",
          empresa:
            data.empresa ||
            datosEmpresa.nombreEmpresa ||
            "",
          datosEmpresa: tieneDatosEmpresa
            ? datosEmpresa
            : undefined,
          interes: data.interes || "",
          estado,
        };
      });

      setSolicitudes(datos);

      if (sincronizaciones.length > 0) {
        await Promise.allSettled(sincronizaciones);
      }
    } catch (error) {
      console.error(
        "Error al cargar solicitudes de personas:",
        error
      );
    } finally {
      setCargando(false);
    }
  }

  void cargarSolicitudes();
}, []);

  // Estado menú desplegable acciones
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Modales
  const [modalEmpresaAbierto, setModalEmpresaAbierto] = useState(false);
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<SolicitudPersona | null>(null);

  const [formEmpresa, setFormEmpresa] = useState<DatosEmpresa>({
    ruc: "",
    nombreEmpresa: "",
    nombreContacto: "",
    correoCorporativo: "",
    telefono: "",
  });

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setMenuAbiertoId(menuAbiertoId === id ? null : id);
  };

  const enviarInvitacion = async (solicitud: SolicitudPersona) => {
    try {
      setMenuAbiertoId(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/send-registration-invitation`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: solicitud.email,
            nombre: solicitud.nombre,
            dni: solicitud.dni,
            telefono: solicitud.telefono,
            tipoAlumno: solicitud.tipoAlumno,
            empresaAliada: solicitud.empresa || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "No se pudo enviar la invitación."
        );
      }

      await cambiarEstadoPersona(
        solicitud.id,
        "Contactado"
      );

      alert("Invitación enviada correctamente.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al enviar la invitación."
      );
    }
  };


  const handleEliminar = (id: string) => {
    setMenuAbiertoId(null);
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      setSolicitudes((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const abrirModalEmpresa = (solicitud: SolicitudPersona) => {
    setMenuAbiertoId(null);
    setPersonaSeleccionada(solicitud);

    setFormEmpresa(
      solicitud.datosEmpresa || {
        ruc: "",
        nombreEmpresa: "",
        nombreContacto: "",
        correoCorporativo: "",
        telefono: "",
      }
    );

    setModalEmpresaAbierto(true);
  };

  const abrirModalDetalles = (solicitud: SolicitudPersona) => {
    setMenuAbiertoId(null);
    setPersonaSeleccionada(solicitud);
    setModalDetallesAbierto(true);
  };

  const cerrarModales = () => {
    setModalEmpresaAbierto(false);
    setModalDetallesAbierto(false);
    setPersonaSeleccionada(null);
  };

  const cambiarEstadoPersona = async (
    id: string,
    nuevoEstado: EstadoSolicitud
  ) => {
    try {
      await updateDoc(
        doc(
          db,
          "FormularioAlumno",
          id
        ),
        {
          estado: nuevoEstado,
        }
      );

      setSolicitudes((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                estado: nuevoEstado,
              }
            : item
        )
      );

      if (
        personaSeleccionada &&
        personaSeleccionada.id === id
      ) {
        setPersonaSeleccionada((prev) =>
          prev
            ? {
                ...prev,
                estado: nuevoEstado,
              }
            : null
        );
      }
    } catch (error) {
      console.error(
        "Error actualizando estado del postulante:",
        error
      );

      alert(
        "No se pudo actualizar el estado."
      );
    }
  };

  const handleGuardarEmpresa = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!personaSeleccionada) {
      return;
    }

    const datosEmpresa: DatosEmpresa = {
      ruc: formEmpresa.ruc.trim(),
      nombreEmpresa: formEmpresa.nombreEmpresa.trim(),
      nombreContacto: formEmpresa.nombreContacto.trim(),
      correoCorporativo: formEmpresa.correoCorporativo.trim(),
      telefono: formEmpresa.telefono.trim(),
    };

    try {
      await updateDoc(
        doc(
          db,
          "FormularioAlumno",
          personaSeleccionada.id
        ),
        {
          empresa: datosEmpresa.nombreEmpresa,
          datos_empresa: datosEmpresa,
          estado: personaSeleccionada.estado,
        }
      );

      setSolicitudes((prev) =>
        prev.map((item) =>
          item.id === personaSeleccionada.id
            ? {
                ...item,
                empresa: datosEmpresa.nombreEmpresa,
                datosEmpresa,
              }
            : item
        )
      );

      alert(
        "Información de empresa guardada exitosamente."
      );

      cerrarModales();
    } catch (error) {
      console.error(
        "Error guardando información de empresa:",
        error
      );

      alert(
        "No se pudo guardar la información de la empresa."
      );
    }
  };

  const renderBadgeEstado = (estado: EstadoSolicitud) => {
    switch (estado) {
      case "Pendiente":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-talentia-warning-bg text-talentia-warning border border-talentia-warning/80 text-[13px] font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-talentia-warning"></span>
            Pendiente
          </span>
        );
      case "Contactado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-talentia-selected text-talentia-primary border border-talentia-border/80 text-[13px] font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-talentia-teal animate-pulse"></span>
            Contactado
          </span>
        );
      case "Matriculado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-talentia-success-bg text-talentia-success border border-talentia-success/80 text-[13px] font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-talentia-success"></span>
            Matriculado
          </span>
        );
      case "Cancelado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-talentia-surface text-talentia-primary border border-talentia-border text-[13px] font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-talentia-border"></span>
            Cancelado
          </span>
        );
    }
  };


  function exportarExcelPersonas() {
    const alumnosConvenio = solicitudes
      .filter((item) => item.tipoAlumno === "Convenio")
      .map((item) => ({
        Fecha: item.fecha,
        "Nombre completo": item.nombre,
        DNI: item.dni,
        Correo: item.email,
        Teléfono: item.telefono,
        "Tipo de alumno": "Alumno con Convenio",
        Empresa: item.empresa || "",
        Interés: item.interes,
        Estado: item.estado,
      }));

    const alumnosExternos = solicitudes
      .filter((item) => item.tipoAlumno === "Externo")
      .map((item) => ({
        Fecha: item.fecha,
        "Nombre completo": item.nombre,
        DNI: item.dni,
        Correo: item.email,
        Teléfono: item.telefono,
        "Tipo de alumno": "Alumno Externo",
        Interés: item.interes,
        Estado: item.estado,
      }));

    const fecha = new Date().toISOString().slice(0, 10);
    const fechaExportacion = new Date().toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const workbook = XLSX.utils.book_new();

    const crearHojaSolicitudes = (
      titulo: string,
      tipo: string,
      columnas: string[],
      filas: Record<string, string>[],
      anchos: number[],
    ) => {
      const contenido: (string | number | boolean | Date)[][] = [
        [titulo],
        [`Tipo de registro: ${tipo}`],
        [`Fecha de exportación: ${fechaExportacion}`],
        [`Registros: ${filas.length}`],
        [],
        columnas,
        ...filas.map((fila) => columnas.map((columna) => fila[columna] ?? "")),
      ];

      const hoja = XLSX.utils.aoa_to_sheet(contenido);
      const totalColumnas = columnas.length;
      hoja["!merges"] = [0, 1, 2, 3].map((fila) => ({
        s: { r: fila, c: 0 },
        e: { r: fila, c: totalColumnas - 1 },
      }));
      hoja["!cols"] = anchos.map((wch) => ({ wch }));

      if (filas.length > 0) {
        hoja["!autofilter"] = {
          ref: XLSX.utils.encode_range({
            s: { r: 5, c: 0 },
            e: { r: 5 + filas.length, c: totalColumnas - 1 },
          }),
        };
      }

      aplicarEstilosExcelTalentia(hoja as unknown as Record<string, unknown>, {
        totalColumns: totalColumnas,
        titleRow: 0,
        metadataRows: [1, 2, 3],
        headerRow: 5,
        firstDataRow: 6,
        lastDataRow: 5 + filas.length,
      });

      return hoja;
    };

    const columnasConvenio = [
      "Fecha", "Nombre completo", "DNI", "Correo", "Teléfono",
      "Tipo de alumno", "Empresa", "Interés", "Estado",
    ];
    const columnasExternos = [
      "Fecha", "Nombre completo", "DNI", "Correo", "Teléfono",
      "Tipo de alumno", "Interés", "Estado",
    ];

    const hojaConvenio = crearHojaSolicitudes(
      "Registro de solicitudes de personas",
      "Alumnos con convenio",
      columnasConvenio,
      alumnosConvenio,
      [15, 32, 15, 34, 16, 22, 28, 55, 16],
    );
    const hojaExternos = crearHojaSolicitudes(
      "Registro de solicitudes de personas",
      "Alumnos externos",
      columnasExternos,
      alumnosExternos,
      [15, 32, 15, 34, 16, 22, 55, 16],
    );

    XLSX.utils.book_append_sheet(workbook, hojaConvenio, "Alumnos Convenio");
    XLSX.utils.book_append_sheet(workbook, hojaExternos, "Alumnos Externos");
    XLSX.writeFile(workbook, `solicitudes-personas-${fecha}.xlsx`);
  }

  const solicitudesFiltradas = solicitudes.filter(
    (item) =>
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.dni.includes(busqueda) ||
      (item.empresa && item.empresa.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm relative xl:p-8 2xl:max-w-[1560px]">
      {/* Encabezado y buscador */}
     <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-talentia-primary">
            Listado de Registros Personales
          </h2>
          <p className="text-sm text-talentia-muted">
            Interesados desde el formulario público web
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
          <button
            type="button"
            onClick={exportarExcelPersonas}
            disabled={solicitudes.length === 0}
            className="inline-flex h-[44px] items-center justify-center gap-2 rounded-xl bg-talentia-action px-5 text-sm font-bold text-white shadow-sm transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>

            Exportar Excel
          </button>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por DNI, nombre o empresa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-talentia-surface text-sm text-talentia-primary rounded-2xl border border-transparent focus:border-talentia-blue focus:bg-talentia-surface transition outline-none placeholder-talentia-placeholder"
            />
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="overflow-x-auto min-h-[320px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-talentia-table-header text-talentia-primary text-[13px] font-extrabold border-b border-talentia-border">
              <th className="py-4 px-4">Fecha</th>
              <th className="py-4 px-4">Postulante / DNI</th>
              <th className="py-4 px-4">Contacto</th>
              <th className="py-4 px-4">Tipo de Alumno</th>
              <th className="py-4 px-4">Interés</th>
              <th className="py-4 px-4">Estado</th>
              <th className="py-4 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-talentia-border text-[13px] font-semibold text-talentia-muted">
            {cargando ? (
  <tr>
    <td
      colSpan={7}
      className="text-center py-8 text-talentia-muted"
    >
      Cargando solicitudes...
    </td>
  </tr>
) : solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((item) => (
                <tr key={item.id} className="hover:bg-talentia-hover/60 transition">
                  <td className="py-4 px-4 text-talentia-muted whitespace-nowrap">
                    {item.fecha}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <p className="font-bold text-talentia-primary">{item.nombre}</p>
                    <p className="text-[13px] text-talentia-muted">DNI: {item.dni}</p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <p className="text-talentia-muted font-semibold">{item.email}</p>
                    <p className="text-[13px] text-talentia-muted">{item.telefono}</p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {item.tipoAlumno === "Convenio" ? (
                      <div>
                        <span className="inline-block px-3 py-1 bg-talentia-success-bg text-talentia-success border border-talentia-success/20 text-[13px] font-bold rounded-full">
                          Alumno con Convenio
                        </span>
                        {item.empresa && (
                          <p className="text-[13px] text-talentia-blue font-semibold mt-1">
                            {item.empresa}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-talentia-surface text-talentia-primary text-[13px] font-semibold rounded-full">
                        Alumno Externo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-talentia-primary font-semibold whitespace-nowrap">
                    {item.interes}
                  </td>
                  
                  {/* Columna Estado */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {renderBadgeEstado(item.estado)}
                  </td>

                  {/* Columna Acciones */}
                  <td className="py-4 px-4 whitespace-nowrap text-center relative">
                    <div className="relative inline-block text-left" ref={menuAbiertoId === item.id ? menuRef : null}>
                     <button
                       type="button"
                       onClick={() => toggleMenu(item.id)}
                       aria-label="Abrir acciones"
                       title="Acciones"
                       className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-talentia-muted transition hover:bg-talentia-hover hover:text-talentia-primary cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                         <circle cx="12" cy="5" r="1.7" />
                         <circle cx="12" cy="12" r="1.7" />
                         <circle cx="12" cy="19" r="1.7" />
                       </svg>
                     </button>

                      {/* Dropdown Menu */}
                      {menuAbiertoId === item.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-talentia-surface rounded-2xl shadow-xl border border-talentia-border py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            type="button"
                            onClick={() => abrirModalDetalles(item)}
                            className="w-full text-left px-4 py-2 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover flex items-center gap-2.5 transition"
                          >
                            <svg className="w-4 h-4 text-talentia-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Ver Detalles</span>
                          </button>

                          <button
  type="button"
  onClick={() => enviarInvitacion(item)}
  className="w-full text-left px-4 py-2 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover flex items-center gap-2.5 transition"
>
  <svg
    className="w-4 h-4 text-talentia-blue"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V6H3v10z"
    />
  </svg>

  <span>Enviar correo de registro</span>
</button>

                          {item.tipoAlumno === "Convenio" && (
                            <button
                              type="button"
                              onClick={() => abrirModalEmpresa(item)}
                              className="w-full text-left px-4 py-2 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover flex items-center gap-2.5 transition"
                            >
                              <svg className="w-4 h-4 text-talentia-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                              <span>{item.datosEmpresa ? "Editar Empresa" : "Registrar Empresa"}</span>
                            </button>
                          )}

                          <div className="my-1 border-t border-talentia-border" />

                          <button
                            type="button"
                            onClick={() => handleEliminar(item.id)}
                            className="w-full text-left px-4 py-2 text-[13px] font-semibold text-talentia-danger hover:bg-talentia-danger-bg flex items-center gap-2.5 transition"
                          >
                            <svg className="w-4 h-4 text-talentia-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-talentia-muted">
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLES COMPLETO (INCLUYE INFORMACIÓN DE LA EMPRESA SI APLICA) */}
      {modalDetallesAbierto && personaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-talentia-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-talentia-surface w-full max-w-lg rounded-3xl p-6 shadow-xl border border-talentia-border relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={cerrarModales}
              className="absolute top-5 right-5 text-talentia-muted hover:text-talentia-primary p-1.5 rounded-full hover:bg-talentia-hover transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-talentia-surface text-talentia-blue rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-talentia-primary">Ficha del Postulante</h3>
                <p className="text-xs text-talentia-muted">Información personal y de empresa</p>
              </div>
            </div>

            {/* Datos Personales */}
            <div className="space-y-3 bg-talentia-surface p-4 rounded-2xl text-sm mb-4">
              <p className="text-xs font-bold text-talentia-blue uppercase tracking-wider mb-2">
                Datos del Postulante
              </p>
              <div className="flex justify-between border-b border-talentia-border/60 pb-2">
                <span className="text-talentia-muted">Nombre:</span>
                <span className="font-bold text-talentia-primary">{personaSeleccionada.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-talentia-border/60 pb-2">
                <span className="text-talentia-muted">DNI:</span>
                <span className="font-medium text-talentia-primary">{personaSeleccionada.dni}</span>
              </div>
              <div className="flex justify-between border-b border-talentia-border/60 pb-2">
                <span className="text-talentia-muted">Correo:</span>
                <span className="font-medium text-talentia-primary">{personaSeleccionada.email}</span>
              </div>
              <div className="flex justify-between border-b border-talentia-border/60 pb-2">
                <span className="text-talentia-muted">Teléfono:</span>
                <span className="font-medium text-talentia-primary">{personaSeleccionada.telefono}</span>
              </div>
              <div className="flex justify-between border-b border-talentia-border/60 pb-2">
                <span className="text-talentia-muted">Programa de Interés:</span>
                <span className="font-semibold text-talentia-primary">{personaSeleccionada.interes}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-talentia-muted font-medium">Estado del Lead:</span>
                <select
                  value={personaSeleccionada.estado}
                  onChange={(e) =>
                    void cambiarEstadoPersona(
                      personaSeleccionada.id,
                      e.target.value as EstadoSolicitud
                    )
                  }
                  className="px-3 py-1 bg-talentia-surface border border-talentia-border rounded-xl text-xs font-bold text-talentia-primary outline-none focus:border-talentia-blue cursor-pointer"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Matriculado">Matriculado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Datos de Empresa (Solo si aplica) */}
            {personaSeleccionada.tipoAlumno === "Convenio" && (
              <div className="space-y-3 bg-talentia-success-bg/50 border border-talentia-success/20 p-4 rounded-2xl text-sm mb-5">
                <div className="flex items-center justify-between border-b border-talentia-success/20 pb-2">
                  <p className="text-xs font-bold text-talentia-success uppercase tracking-wider">
                    Datos de la Empresa Convenida
                  </p>
                  <button
                    onClick={() => {
                      cerrarModales();
                      abrirModalEmpresa(personaSeleccionada);
                    }}
                    className="text-xs text-talentia-blue font-bold hover:underline"
                  >
                    {personaSeleccionada.datosEmpresa ? "Editar" : "+ Registrar"}
                  </button>
                </div>

                {personaSeleccionada.datosEmpresa ? (
                  <>
                    <div className="flex justify-between border-b border-talentia-success/60 pb-2">
                      <span className="text-talentia-muted">RUC:</span>
                      <span className="font-bold text-talentia-primary">{personaSeleccionada.datosEmpresa.ruc}</span>
                    </div>
                    <div className="flex justify-between border-b border-talentia-success/60 pb-2">
                      <span className="text-talentia-muted">Razón Social / Empresa:</span>
                      <span className="font-bold text-talentia-primary">{personaSeleccionada.datosEmpresa.nombreEmpresa}</span>
                    </div>
                    <div className="flex justify-between border-b border-talentia-success/60 pb-2">
                      <span className="text-talentia-muted">Contacto Empresa:</span>
                      <span className="font-medium text-talentia-primary">{personaSeleccionada.datosEmpresa.nombreContacto}</span>
                    </div>
                    <div className="flex justify-between border-b border-talentia-success/60 pb-2">
                      <span className="text-talentia-muted">Correo Corp.:</span>
                      <span className="font-medium text-talentia-primary">{personaSeleccionada.datosEmpresa.correoCorporativo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-talentia-muted">Teléfono Corp.:</span>
                      <span className="font-medium text-talentia-primary">{personaSeleccionada.datosEmpresa.telefono}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-talentia-muted py-1 italic">
                    Este postulante es de tipo Convenio pero aún no tiene datos institucionales registrados.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={cerrarModales}
              className="w-full py-2.5 bg-talentia-action hover:bg-talentia-primary text-white font-bold text-sm rounded-2xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR EMPRESA */}
      {modalEmpresaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-talentia-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-talentia-surface w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-xl border border-talentia-border relative">
            <button
              onClick={cerrarModales}
              className="absolute top-5 right-5 text-talentia-muted hover:text-talentia-primary p-1.5 rounded-full hover:bg-talentia-hover transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-3.5 bg-talentia-surface text-talentia-blue rounded-2xl flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-talentia-primary leading-tight">
                  Información de la Empresa
                </h3>
                <p className="text-xs text-talentia-muted mt-1">
                  Ingresa o actualiza los datos institucionales del convenio
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarEmpresa} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-talentia-primary mb-1 pl-1">
                  RUC de la empresa
                </label>
                <input
                  type="text"
                  placeholder="Ej. 20123456789"
                  required
                  value={formEmpresa.ruc}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, ruc: e.target.value })}
                  className="w-full px-4 py-2.5 bg-talentia-surface text-sm text-talentia-primary rounded-2xl border border-transparent focus:border-talentia-blue focus:bg-talentia-surface transition outline-none placeholder-talentia-placeholder"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-talentia-primary mb-1 pl-1">
                  Nombre o Razón Social
                </label>
                <input
                  type="text"
                  placeholder="Ej. BCP / Alicorp"
                  required
                  value={formEmpresa.nombreEmpresa}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, nombreEmpresa: e.target.value })}
                  className="w-full px-4 py-2.5 bg-talentia-surface text-sm text-talentia-primary rounded-2xl border border-transparent focus:border-talentia-blue focus:bg-talentia-surface transition outline-none placeholder-talentia-placeholder"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-talentia-primary mb-1 pl-1">
                    Contacto de Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    required
                    value={formEmpresa.nombreContacto}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, nombreContacto: e.target.value })}
                    className="w-full px-4 py-2.5 bg-talentia-surface text-sm text-talentia-primary rounded-2xl border border-transparent focus:border-talentia-blue focus:bg-talentia-surface transition outline-none placeholder-talentia-placeholder"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-talentia-primary mb-1 pl-1">
                    Teléfono Corporativo
                  </label>
                  <input
                    type="text"
                    placeholder="+51..."
                    required
                    value={formEmpresa.telefono}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, telefono: e.target.value })}
                    className="w-full px-4 py-2.5 bg-talentia-surface text-sm text-talentia-primary rounded-2xl border border-transparent focus:border-talentia-blue focus:bg-talentia-surface transition outline-none placeholder-talentia-placeholder"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-talentia-primary mb-1 pl-1">
                  Correo Corporativo
                </label>
                <input
                  type="email"
                  placeholder="correo@empresa.com"
                  required
                  value={formEmpresa.correoCorporativo}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, correoCorporativo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-talentia-surface text-sm text-talentia-primary rounded-2xl border border-transparent focus:border-talentia-blue focus:bg-talentia-surface transition outline-none placeholder-talentia-placeholder"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModales}
                  className="w-1/3 py-2.5 bg-talentia-surface hover:bg-talentia-border text-talentia-primary font-semibold text-sm rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-talentia-action hover:bg-talentia-primary text-white font-bold text-sm rounded-2xl transition shadow-md active:scale-95 cursor-pointer"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
