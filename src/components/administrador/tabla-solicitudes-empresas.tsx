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

import * as XLSX from "xlsx";


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


  function exportarExcelEmpresas() {
    const datos =
      solicitudes.map(
        (item) => ({
          Fecha:
            item.fecha,

          Empresa:
            item.empresa,

          RUC:
            item.ruc,

          "Persona de contacto":
            item.contacto,

          "Correo corporativo":
            item.correo,

          "Teléfono":
            item.telefono,

          "Interés de capacitación":
            item.interes,

          Estado:
            item.estado,
        })
      );


    const workbook =
      XLSX.utils.book_new();


    const worksheet =
      XLSX.utils.json_to_sheet(
        datos
      );


    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 32 },
      { wch: 18 },
      { wch: 30 },
      { wch: 34 },
      { wch: 16 },
      { wch: 48 },
      { wch: 16 },
    ];


    if (
      datos.length >
      0
    ) {
      worksheet[
        "!autofilter"
      ] = {
        ref:
          worksheet["!ref"]!,
      };
    }


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Solicitudes Empresas"
    );


    const fecha =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );


    XLSX.writeFile(
      workbook,
      `solicitudes-empresas-${fecha}.xlsx`
    );
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
        <span className="inline-block rounded-full border border-talentia-success/20 bg-talentia-success-bg px-3 py-1 text-[13px] font-extrabold text-talentia-success">
          Atendido
        </span>
      );
    }


    if (
      estado ===
      "Cancelado"
    ) {
      return (
        <span className="inline-block rounded-full border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-1 text-[13px] font-extrabold text-talentia-danger">
          Cancelado
        </span>
      );
    }


    return (
      <span className="inline-block rounded-full border border-talentia-warning/20 bg-talentia-warning-bg px-3 py-1 text-[13px] font-extrabold text-talentia-warning">
        Pendiente
      </span>
    );
  }


  return (
    <div className="mx-auto w-full max-w-[1500px] rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm xl:p-8 2xl:max-w-[1560px]">

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h2 className="text-sm font-extrabold text-talentia-primary">
            Solicitudes Corporativas
          </h2>

          <p className="mt-0.5 text-[13px] font-semibold text-talentia-muted">
            Empresas interesadas en capacitaciones masivas o convenios
          </p>

        </div>


        <button
          type="button"
          onClick={
            exportarExcelEmpresas
          }
          disabled={
            solicitudes.length ===
            0
          }
          className="inline-flex h-[44px] items-center justify-center gap-2 rounded-xl bg-talentia-action px-5 text-sm font-bold text-white shadow-sm transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>

          Exportar Excel
        </button>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full border-collapse text-left">

          <thead>

            <tr className="bg-talentia-table-header text-talentia-primary text-[13px] font-extrabold border-b border-talentia-border">

              <th className="px-4 py-4">
                Fecha
              </th>

              <th className="px-4 py-4">
                Empresa / RUC
              </th>

              <th className="px-4 py-4">
                Persona de Contacto
              </th>

              <th className="px-4 py-4">
                Interés Capacitación
              </th>

              <th className="px-4 py-4 text-center">
                Estado
              </th>

              <th className="w-[70px] px-4 py-4 text-center">
                Acciones
              </th>

            </tr>

          </thead>


          <tbody className="divide-y divide-talentia-border text-[13px] font-semibold text-talentia-muted">

            {cargando ? (

              <tr>

                <td
                  colSpan={
                    6
                  }
                  className="py-10 text-center text-talentia-muted"
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
                    className="transition hover:bg-talentia-hover"
                  >

                    {/* FECHA */}

                    <td className="px-3 py-4 font-semibold text-talentia-muted">
                      {
                        item.fecha
                      }
                    </td>


                    {/* EMPRESA */}

                    <td className="px-3 py-4">

                      <p className="font-bold text-talentia-primary">
                        {
                          item.empresa
                        }
                      </p>

                      <p className="text-[13px] text-talentia-muted">
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

                      <p className="text-[13px] text-talentia-muted">
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

                    <td className="max-w-[280px] px-3 py-4 font-semibold text-talentia-muted">

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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[22px] font-bold leading-none text-talentia-muted transition hover:bg-talentia-hover hover:text-talentia-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Cambiar estado de ${item.empresa}`}
                      >
                        {actualizandoId ===
                        item.id
                          ? "…"
                          : "⋮"}
                      </button>


                      {menuAbiertoId ===
                        item.id && (

                        <div className="absolute right-3 top-[50px] z-50 w-[155px] overflow-hidden rounded-xl border border-talentia-border bg-talentia-surface py-1 text-left shadow-xl">


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
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition hover:bg-talentia-warning-bg ${
                              item.estado ===
                              "Pendiente"
                                ? "bg-talentia-warning-bg text-talentia-warning"
                                : "text-talentia-primary"
                            }`}
                          >

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-talentia-warning" />

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
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition hover:bg-talentia-success-bg ${
                              item.estado ===
                              "Atendido"
                                ? "bg-talentia-success-bg text-talentia-success"
                                : "text-talentia-primary"
                            }`}
                          >

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-talentia-success" />

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
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition hover:bg-talentia-danger-bg ${
                              item.estado ===
                              "Cancelado"
                                ? "bg-talentia-danger-bg text-talentia-danger"
                                : "text-talentia-danger"
                            }`}
                          >

                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-talentia-danger" />

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
                  className="py-10 text-center text-talentia-muted"
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
