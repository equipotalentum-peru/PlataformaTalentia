"use client";

import { useState } from "react";

// Datos de prueba B2B
const MOCK_SOLICITUDES_EMPRESAS = [
  {
    id: 1,
    fecha: "28 Feb 2026",
    ruc: "20100047218",
    empresa: "Banco de Crédito del Perú (BCP)",
    contacto: "Mariana Gonzáles",
    correo: "mgonzales@bcp.com.pe",
    telefono: "+51 988 776 655",
    interes: "Capacitación UX/UI para Equipos",
    estado: "En Negociación",
  },
  {
    id: 2,
    fecha: "25 Feb 2026",
    ruc: "20508930129",
    empresa: "Innovatech Solutions S.A.C.",
    contacto: "Roberto Gómez",
    correo: "rgomez@innovatech.pe",
    telefono: "+51 944 332 211",
    interes: "Programa Frontend Corporativo",
    estado: "Pendiente",
  },
];

export default function TablaSolicitudesEmpresas() {
  const [solicitudes] = useState(MOCK_SOLICITUDES_EMPRESAS);

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
            {solicitudes.map((item) => (
              <tr key={item.id} className="hover:bg-[#F8FAFC] transition">
                <td className="py-4 px-3 text-[#64748B] font-semibold">{item.fecha}</td>
                <td className="py-4 px-3">
                  <p className="font-bold text-[#0F2851]">{item.empresa}</p>
                  <p className="text-[11px] text-[#64748B]">RUC: {item.ruc}</p>
                </td>
                <td className="py-4 px-3">
                  <p className="font-semibold">{item.contacto}</p>
                  <p className="text-[11px] text-[#64748B]">{item.correo} | {item.telefono}</p>
                </td>
                <td className="py-4 px-3 font-semibold text-[#0F2851]">{item.interes}</td>
                <td className="py-4 px-3 text-center">
                  <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {item.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}