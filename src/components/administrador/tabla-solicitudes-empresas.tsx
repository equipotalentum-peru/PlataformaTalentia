"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../../lib/firebase";


type EstadoEmpresa =
  | "Pendiente"
  | "Atendido"
  | "Cancelado";


type SolicitudEmpresa = {
  id: string;
  fecha: string;
  ruc: string;
  empresa: string;
  contacto: string;
  correo: string;
  telefono: string;
  interes: string;
  estado: EstadoEmpresa;
};


export default function TablaSolicitudesEmpresas() {
  const [
    solicitudes,
    setSolicitudes,
  ] =
    useState<
      SolicitudEmpresa[]
    >([]);


  const [
    cargando,
    setCargando,
  ] =
    useState(true);


  const [
    menuAbiertoId,
    setMenuAbiertoId,
  ] =
    useState<
      string | null
    >(null);


  const [
    actualizandoId,
    setActualizandoId,
  ] =
    useState<
      string | null
    >(null);


  useEffect(() => {
    async function cargarSolicitudesEmpresas() {
      try {
        setCargando(
          true
        );


        const consulta =
          query(
            collection(
              db,
              "FormularioEmpresa"
            ),
            orderBy(
              "fecha_registro",
              "desc"
            )
          );


        const snapshot =
          await getDocs(
            consulta
          );


        const datos:
          SolicitudEmpresa[] =
          snapshot.docs.map(
            (
              documento
            ) => {

              const data =
                documento.data();


              let fecha =
                "Sin fecha";


              if (
                data.fecha_registro
                  ?.toDate
              ) {
                fecha =
                  data.fecha_registro
                    .toDate()
                    .toLocaleDateString(
                      "es-PE",
                      {
                        day:
                          "2-digit",

                        month:
                          "short",

                        year:
                          "numeric",
                      }
                    );
              }


              const estado:
                EstadoEmpresa =
                data.estado ===
                  "Atendido" ||
                data.estado ===
                  "Cancelado" ||
                data.estado ===
                  "Pendiente"
                  ? data.estado
                  : "Pendiente";


              return {
                id:
                  documento.id,

                fecha,

                ruc:
                  data.ruc ||
                  "",

                empresa:
                  data.empresa ||
                  "",

                contacto:
                  data.contacto ||
                  "",

                correo:
                  data.email ||
                  "",

                telefono:
                  data.telefono ||
                  "",

                interes:
                  data.interes ||
                  "",

                estado,
              };
            }
          );


        setSolicitudes(
          datos
        );

      } catch (error) {

        console.error(
          "Error al cargar solicitudes de empresas:",
          error
        );

      } finally {

        setCargando(
          false
        );
      }
    }


    void cargarSolicitudesEmpresas();

  }, []);


  async function cambiarEstado(
    id: string,
    nuevoEstado:
      EstadoEmpresa
  ) {
    try {
      setActualizandoId(
        id
      );


      const referencia =
        doc(
          db,
          "FormularioEmpresa",
          id
        );


      await updateDoc(
        referencia,
        {
          estado:
            nuevoEstado,
        }
      );


      setSolicitudes(
        (
          actuales
        ) =>
          actuales.map(
            (
              solicitud
            ) =>
              solicitud.id ===
              id
                ? {
                    ...solicitud,

                    estado:
                      nuevoEstado,
                  }
                : solicitud
          )
      );


      setMenuAbiertoId(
        null
      );

    } catch (error) {

      console.error(
        "Error al actualizar estado de empresa:",
        error
      );


      window.alert(
        "No se pudo actualizar el estado de la solicitud."
      );

    } finally {

      setActualizandoId(
        null
      );
    }
  }


  function renderEstado(
    estado:
      EstadoEmpresa
  ) {
    if (
      estado ===
      "Atendido"
    ) {
      return (
        <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700">
          Atendido
        </span>
      );
    }


    if (
      estado ===
      "Cancelado"
    ) {
      return (
        <span className="inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-extrabold text-red-600">
          Cancelado
        </span>
      );
    }


    return (
      <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-700">
        Pendiente
      </span>
    );
  }


  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h2 className="text-lg font-extrabold text-[#0F2851]">
            Solicitudes Corporativas (B2B)
          </h2>

          <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
            Empresas interesadas en capacitaciones masivas o convenios
          </p>

        </div>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full border-collapse text-left">

          <thead>

            <tr className="border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">

              <th className="px-3 pb-3">
                Fecha
              </th>

              <th className="px-3 pb-3">
                Empresa / RUC
              </th>

              <th className="px-3 pb-3">
                Persona de Contacto
              </th>

              <th className="px-3 pb-3">
                Interés Capacitación
              </th>

              <th className="px-3 pb-3 text-center">
                Estado
              </th>

              <th className="w-[70px] px-3 pb-3 text-center">
                Acciones
              </th>

            </tr>

          </thead>


          <tbody className="divide-y divide-gray-50 text-xs font-medium text-[#0F2851]">

            {cargando ? (

              <tr>

                <td
                  colSpan={
                    6
                  }
                  className="py-10 text-center text-[#64748B]"
                >
                  Cargando solicitudes...
                </td>

              </tr>

            ) : solicitudes.length >
              0 ? (

              solicitudes.map(
                (
                  item
                ) => (

                  <tr
                    key={
                      item.id
                    }
                    className="transition hover:bg-[#F8FAFC]"
                  >

                    {/* FECHA */}

                    <td className="px-3 py-4 font-semibold text-[#64748B]">
                      {
                        item.fecha
                      }
                    </td>


                    {/* EMPRESA */}

                    <td className="px-3 py-4">

                      <p className="font-bold text-[#0F2851]">
                        {
                          item.empresa
                        }
                      </p>

                      <p className="text-[11px] text-[#64748B]">
                        RUC:{" "}
                        {
                          item.ruc
                        }
                      </p>

                    </td>


                    {/* CONTACTO */}

                    <td className="px-3 py-4">

                      <p className="font-semibold">
                        {
                          item.contacto
                        }
                      </p>

                      <p className="text-[11px] text-[#64748B]">
                        {
                          item.correo
                        }{" "}
                        |{" "}
                        {
                          item.telefono
                        }
                      </p>

                    </td>


                    {/* INTERÉS */}

                    <td className="max-w-[280px] px-3 py-4 font-semibold text-[#0F2851]">

                      <p
                        className="truncate"
                        title={
                          item.interes
                        }
                      >
                        {
                          item.interes
                        }
                      </p>

                    </td>


                    {/* ESTADO */}

                    <td className="px-3 py-4 text-center">
                      {renderEstado(
                        item.estado
                      )}
                    </td>


                    {/* ACCIONES */}

                    <td className="relative px-3 py-4 text-center">

                      <button
                        type="button"
                        disabled={
                          actualizandoId ===
                          item.id
                        }
                        onClick={() =>
                          setMenuAbiertoId(
                            (
                              actual
                            ) =>
                              actual ===
                              item.id
                                ? null
                                : item.id
                          )
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[22px] font-bold leading-none text-[#64748B] transition hover:bg-[#EEF2F7] hover:text-[#0F2851] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Cambiar estado de ${item.empresa}`}
                      >
                        {actualizandoId ===
                        item.id
                          ? "…"
                          : "⋮"}
                      </button>


                      {menuAbiertoId ===
                        item.id && (

                        <div className="absolute right-3 top-[50px] z-50 w-[155px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">


                          {/* PENDIENTE */}

                          <button
                            type="button"
                            disabled={
                              actualizandoId ===
                              item.id
                            }
                            onClick={() =>
                              void cambiarEstado(
                                item.id,
                                "Pendiente"
                              )
                            }
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition hover:bg-amber-50 ${
                              item.estado ===
                              "Pendiente"
                                ? "bg-amber-50 text-amber-700"
                                : "text-[#0F2851]"
                            }`}
                          >

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />

                            Pendiente

                          </button>


                          {/* ATENDIDO */}

                          <button
                            type="button"
                            disabled={
                              actualizandoId ===
                              item.id
                            }
                            onClick={() =>
                              void cambiarEstado(
                                item.id,
                                "Atendido"
                              )
                            }
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition hover:bg-emerald-50 ${
                              item.estado ===
                              "Atendido"
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-[#0F2851]"
                            }`}
                          >

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

                            Atendido

                          </button>


                          {/* CANCELADO */}

                          <button
                            type="button"
                            disabled={
                              actualizandoId ===
                              item.id
                            }
                            onClick={() =>
                              void cambiarEstado(
                                item.id,
                                "Cancelado"
                              )
                            }
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition hover:bg-red-50 ${
                              item.estado ===
                              "Cancelado"
                                ? "bg-red-50 text-red-600"
                                : "text-red-600"
                            }`}
                          >

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />

                            Cancelar

                          </button>

                        </div>

                      )}

                    </td>

                  </tr>

                )
              )

            ) : (

              <tr>

                <td
                  colSpan={
                    6
                  }
                  className="py-10 text-center text-[#64748B]"
                >
                  No se encontraron solicitudes de empresas.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}