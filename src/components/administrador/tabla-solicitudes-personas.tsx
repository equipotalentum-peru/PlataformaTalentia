"use client";

import { useState, useRef, useEffect } from "react";

type EstadoSolicitud = "Pendiente" | "En Proceso" | "Contactado" | "Desestimado";

interface DatosEmpresa {
  ruc: string;
  nombreEmpresa: string;
  nombreContacto: string;
  correoCorporativo: string;
  telefono: string;
  interes: string;
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

const INITIAL_DATA: SolicitudPersona[] = [
  {
    id: "1",
    fecha: "28 Feb 2026",
    nombre: "Carlos Eduardo Mendoza",
    dni: "74839201",
    email: "carlos.mendoza@email.com",
    telefono: "+51 987 654 321",
    tipoAlumno: "Convenio",
    empresa: "Banco de Crédito del Perú (BCP)",
    datosEmpresa: {
      ruc: "20100047218",
      nombreEmpresa: "Banco de Crédito del Perú (BCP)",
      nombreContacto: "Luciana Gómez (RRHH)",
      correoCorporativo: "lgomez@bcp.com.pe",
      telefono: "+51 1 313 2000",
      interes: "Diseño UX/UI",
    },
    interes: "Diseño UX/UI",
    estado: "Pendiente",
  },
  {
    id: "2",
    fecha: "27 Feb 2026",
    nombre: "María Fernanda Torres",
    dni: "45920183",
    email: "m.torres@gmail.com",
    telefono: "+51 912 345 678",
    tipoAlumno: "Externo",
    interes: "Data Analytics",
    estado: "Contactado",
  },
  {
    id: "3",
    fecha: "26 Feb 2026",
    nombre: "Juan Pablo Quispe",
    dni: "71029384",
    email: "juan.pablo@hotmail.com",
    telefono: "+51 955 443 322",
    tipoAlumno: "Externo",
    interes: "Desarrollo Web",
    estado: "En Proceso",
  },
  {
    id: "4",
    fecha: "25 Feb 2026",
    nombre: "Lucía Sofía Ramírez",
    dni: "76543210",
    email: "lucia.ramirez@alicorp.com",
    telefono: "+51 933 221 100",
    tipoAlumno: "Convenio",
    empresa: "Alicorp S.A.A.",
    datosEmpresa: {
      ruc: "20100055237",
      nombreEmpresa: "Alicorp S.A.A.",
      nombreContacto: "Roberto Benavides",
      correoCorporativo: "rbenavides@alicorp.com.pe",
      telefono: "+51 1 315 0800",
      interes: "Gestión de Proyectos",
    },
    interes: "Gestión de Proyectos",
    estado: "Pendiente",
  },
];

export default function TablaSolicitudesPersonas() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPersona[]>(INITIAL_DATA);
  const [busqueda, setBusqueda] = useState("");

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
    interes: "",
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
        nombreEmpresa: solicitud.empresa || "",
        nombreContacto: solicitud.nombre,
        correoCorporativo: solicitud.email,
        telefono: solicitud.telefono,
        interes: solicitud.interes,
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

  const cambiarEstadoPersona = (id: string, nuevoEstado: EstadoSolicitud) => {
    setSolicitudes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
    );
    if (personaSeleccionada && personaSeleccionada.id === id) {
      setPersonaSeleccionada((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
    }
  };

  const handleGuardarEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaSeleccionada) return;

    setSolicitudes((prev) =>
      prev.map((item) =>
        item.id === personaSeleccionada.id
          ? {
              ...item,
              empresa: formEmpresa.nombreEmpresa,
              datosEmpresa: { ...formEmpresa },
            }
          : item
      )
    );

    alert(`Información de empresa guardada exitosamente.`);
    cerrarModales();
  };

  const renderBadgeEstado = (estado: EstadoSolicitud) => {
    switch (estado) {
      case "Pendiente":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pendiente
          </span>
        );
      case "En Proceso":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 text-xs font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            En Proceso
          </span>
        );
      case "Contactado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Contactado
          </span>
        );
      case "Desestimado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Desestimado
          </span>
        );
    }
  };

  const solicitudesFiltradas = solicitudes.filter(
    (item) =>
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.dni.includes(busqueda) ||
      (item.empresa && item.empresa.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
      {/* Encabezado y buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F2851]">
            Listado de Registros Personales
          </h2>
          <p className="text-sm text-[#6F83A5]">
            Interesados desde el formulario público web
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por DNI, nombre o empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none placeholder-[#8EA1C0]"
          />
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="overflow-x-auto min-h-[320px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-[#6F83A5] uppercase tracking-wider">
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Postulante / DNI</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Tipo de Alumno</th>
              <th className="py-3 px-4">Interés</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-4 text-[#6F83A5] whitespace-nowrap">
                    {item.fecha}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <p className="font-bold text-[#0F2851]">{item.nombre}</p>
                    <p className="text-xs text-[#6F83A5]">DNI: {item.dni}</p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <p className="text-[#0F2851] font-medium">{item.email}</p>
                    <p className="text-xs text-[#6F83A5]">{item.telefono}</p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {item.tipoAlumno === "Convenio" ? (
                      <div>
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                          Alumno con Convenio
                        </span>
                        {item.empresa && (
                          <p className="text-xs text-[#2D97E8] font-semibold mt-1">
                            {item.empresa}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        Alumno Externo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-[#0F2851] font-medium whitespace-nowrap">
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4F7FC] hover:bg-slate-200 text-[#0F2851] text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/60"
                      >
                        <span>Acciones</span>
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${menuAbiertoId === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {menuAbiertoId === item.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            type="button"
                            onClick={() => abrirModalDetalles(item)}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0F2851] hover:bg-[#F4F7FC] flex items-center gap-2.5 transition"
                          >
                            <svg className="w-4 h-4 text-[#2D97E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Ver Detalles</span>
                          </button>

                          {item.tipoAlumno === "Convenio" && (
                            <button
                              type="button"
                              onClick={() => abrirModalEmpresa(item)}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0F2851] hover:bg-[#F4F7FC] flex items-center gap-2.5 transition"
                            >
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                              <span>{item.datosEmpresa ? "Editar Empresa" : "Registrar Empresa"}</span>
                            </button>
                          )}

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => handleEliminar(item.id)}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition"
                          >
                            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <td colSpan={7} className="text-center py-8 text-[#6F83A5]">
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLES COMPLETO (INCLUYE INFORMACIÓN DE LA EMPRESA SI APLICA) */}
      {modalDetallesAbierto && personaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2851]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={cerrarModales}
              className="absolute top-5 right-5 text-slate-400 hover:text-[#0F2851] p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-[#F4F7FC] text-[#2D97E8] rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F2851]">Ficha del Postulante</h3>
                <p className="text-xs text-[#6F83A5]">Información personal y de empresa</p>
              </div>
            </div>

            {/* Datos Personales */}
            <div className="space-y-3 bg-[#F4F7FC] p-4 rounded-2xl text-sm mb-4">
              <p className="text-xs font-bold text-[#2D97E8] uppercase tracking-wider mb-2">
                Datos del Postulante
              </p>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[#6F83A5]">Nombre:</span>
                <span className="font-bold text-[#0F2851]">{personaSeleccionada.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[#6F83A5]">DNI:</span>
                <span className="font-medium text-[#0F2851]">{personaSeleccionada.dni}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[#6F83A5]">Correo:</span>
                <span className="font-medium text-[#0F2851]">{personaSeleccionada.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[#6F83A5]">Teléfono:</span>
                <span className="font-medium text-[#0F2851]">{personaSeleccionada.telefono}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[#6F83A5]">Programa de Interés:</span>
                <span className="font-semibold text-[#0F2851]">{personaSeleccionada.interes}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#6F83A5] font-medium">Estado del Lead:</span>
                <select
                  value={personaSeleccionada.estado}
                  onChange={(e) =>
                    cambiarEstadoPersona(
                      personaSeleccionada.id,
                      e.target.value as EstadoSolicitud
                    )
                  }
                  className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F2851] outline-none focus:border-[#2D97E8] cursor-pointer"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Desestimado">Desestimado</option>
                </select>
              </div>
            </div>

            {/* Datos de Empresa (Solo si aplica) */}
            {personaSeleccionada.tipoAlumno === "Convenio" && (
              <div className="space-y-3 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-sm mb-5">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Datos de la Empresa Convenida
                  </p>
                  <button
                    onClick={() => {
                      cerrarModales();
                      abrirModalEmpresa(personaSeleccionada);
                    }}
                    className="text-xs text-[#2D97E8] font-bold hover:underline"
                  >
                    {personaSeleccionada.datosEmpresa ? "Editar" : "+ Registrar"}
                  </button>
                </div>

                {personaSeleccionada.datosEmpresa ? (
                  <>
                    <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                      <span className="text-slate-500">RUC:</span>
                      <span className="font-bold text-[#0F2851]">{personaSeleccionada.datosEmpresa.ruc}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                      <span className="text-slate-500">Razón Social / Empresa:</span>
                      <span className="font-bold text-[#0F2851]">{personaSeleccionada.datosEmpresa.nombreEmpresa}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                      <span className="text-slate-500">Contacto Empresa:</span>
                      <span className="font-medium text-[#0F2851]">{personaSeleccionada.datosEmpresa.nombreContacto}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                      <span className="text-slate-500">Correo Corp.:</span>
                      <span className="font-medium text-[#0F2851]">{personaSeleccionada.datosEmpresa.correoCorporativo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Teléfono Corp.:</span>
                      <span className="font-medium text-[#0F2851]">{personaSeleccionada.datosEmpresa.telefono}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 py-1 italic">
                    Este postulante es de tipo Convenio pero aún no tiene datos institucionales registrados.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={cerrarModales}
              className="w-full py-2.5 bg-[#0F2851] hover:bg-[#0A1C3B] text-white font-bold text-sm rounded-2xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR EMPRESA */}
      {modalEmpresaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2851]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 relative">
            <button
              onClick={cerrarModales}
              className="absolute top-5 right-5 text-slate-400 hover:text-[#0F2851] p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-3.5 bg-[#F4F7FC] text-[#2D97E8] rounded-2xl flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0F2851] leading-tight">
                  Información de la Empresa
                </h3>
                <p className="text-xs text-[#6F83A5] mt-1">
                  Ingresa o actualiza los datos institucionales del convenio
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarEmpresa} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F2851] mb-1 pl-1">
                  RUC de la empresa
                </label>
                <input
                  type="text"
                  placeholder="Ej. 20123456789"
                  required
                  value={formEmpresa.ruc}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, ruc: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none placeholder-[#8EA1C0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2851] mb-1 pl-1">
                  Nombre o Razón Social
                </label>
                <input
                  type="text"
                  placeholder="Ej. BCP / Alicorp"
                  required
                  value={formEmpresa.nombreEmpresa}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, nombreEmpresa: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none placeholder-[#8EA1C0]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F2851] mb-1 pl-1">
                    Contacto de Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    required
                    value={formEmpresa.nombreContacto}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, nombreContacto: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none placeholder-[#8EA1C0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2851] mb-1 pl-1">
                    Teléfono Corporativo
                  </label>
                  <input
                    type="text"
                    placeholder="+51..."
                    required
                    value={formEmpresa.telefono}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, telefono: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none placeholder-[#8EA1C0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2851] mb-1 pl-1">
                  Correo Corporativo
                </label>
                <input
                  type="email"
                  placeholder="correo@empresa.com"
                  required
                  value={formEmpresa.correoCorporativo}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, correoCorporativo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none placeholder-[#8EA1C0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2851] mb-1 pl-1">
                  Programa de Interés Institucional
                </label>
                <select
                  value={formEmpresa.interes}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, interes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F4F7FC] text-sm text-[#0F2851] rounded-2xl border border-transparent focus:border-[#2D97E8] focus:bg-white transition outline-none cursor-pointer"
                >
                  <option value="" disabled>¿En qué está interesado?</option>
                  <option value="Diseño UX/UI">Diseño UX/UI</option>
                  <option value="Data Analytics">Data Analytics</option>
                  <option value="Desarrollo Web">Desarrollo Web</option>
                  <option value="Gestión de Proyectos">Gestión de Proyectos</option>
                  <option value="Capacitación Corporativa General">Capacitación Corporativa General</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModales}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[#2D97E8] hover:bg-[#1E82D2] text-white font-bold text-sm rounded-2xl transition shadow-md active:scale-95 cursor-pointer"
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