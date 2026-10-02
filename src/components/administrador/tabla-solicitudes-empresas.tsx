"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

type SolicitudEmpresa = {
  id: string;
  fecha: string;
  ruc: string;
  empresa: string;
  contacto: string;
  correo: string;
  telefono: string;
  interes: string;
  estado: string;
};

export default function TablaSolicitudesEmpresas() {
  const [solicitudes, setSolicitudes] = useState<SolicitudEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarSolicitudesEmpresas() {
      try {
        setCargando(true);

        const consulta = query(
          collection(db, "FormularioEmpresa"),
          orderBy("fecha_registro", "desc")
        );

        const snapshot = await getDocs(consulta);

        const datos: SolicitudEmpresa[] = snapshot.docs.map((documento) => {
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

          return {
            id: documento.id,
            fecha,
            ruc: data.ruc || "",
            empresa: data.empresa || "",
            contacto: data.contacto || "",
            correo: data.email || "",
            telefono: data.telefono || "",
            interes: data.interes || "",
            estado: "Pendiente",
          };
        });

        setSolicitudes(datos);
      } catch (error) {
        console.error(
          "Error al cargar solicitudes de empresas:",
          error
        );
      } finally {
        setCargando(false);
      }
    }

    cargarSolicitudesEmpresas();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-[#0F2851]">
            Solicitudes Corporativas (B2B)
          </h2>

          <p className="text-xs font-semibold text-[#64748B] mt-0.5">
            Empresas interesadas en capacitaciones masivas o convenios
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              <th className="pb-3 px-3">Fecha</th>
              <th className="pb-3 px-3">Empresa / RUC</th>
              <th className="pb-3 px-3">Persona de Contacto</th>
              <th className="pb-3 px-3">Interés Capacitación</th>
              <th className="pb-3 px-3 text-center">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 text-xs font-medium text-[#0F2851]">
            {cargando ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-[#64748B]"
                >
                  Cargando solicitudes...
                </td>
              </tr>
            ) : solicitudes.length > 0 ? (
              solicitudes.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F8FAFC] transition"
                >
                  <td className="py-4 px-3 text-[#64748B] font-semibold">
                    {item.fecha}
                  </td>

                  <td className="py-4 px-3">
                    <p className="font-bold text-[#0F2851]">
                      {item.empresa}
                    </p>

                    <p className="text-[11px] text-[#64748B]">
                      RUC: {item.ruc}
                    </p>
                  </td>

                  <td className="py-4 px-3">
                    <p className="font-semibold">
                      {item.contacto}
                    </p>

                    <p className="text-[11px] text-[#64748B]">
                      {item.correo} | {item.telefono}
                    </p>
                  </td>

                  <td className="py-4 px-3 font-semibold text-[#0F2851] max-w-[280px]">
                    <p
                      className="truncate"
                      title={item.interes}
                    >
                      {item.interes}
                    </p>
                  </td>

                  <td className="py-4 px-3 text-center">
                    <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
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