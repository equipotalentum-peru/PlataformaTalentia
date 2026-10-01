"use client";

import { useState } from "react";

// Datos de prueba estéticos
const MOCK_SOLICITUDES_PERSONAS = [
  {
    id: 1,
    fecha: "28 Feb 2026",
    nombre: "Carlos Eduardo Mendoza",
    dni: "74839201",
    correo: "carlos.mendoza@email.com",
    telefono: "+51 987 654 321",
    trabaja: true,
    empresa: "BCP",
    esEmpresaSocia: true, // Aplica descuento
    interes: "Diseño UX/UI",
    estado: "Pendiente",
  },
  {
    id: 2,
    fecha: "27 Feb 2026",
    nombre: "María Fernanda Torres",
    dni: "45920183",
    correo: "m.torres@gmail.com",
    telefono: "+51 912 345 678",
    trabaja: true,
    empresa: "Tech Solution Peru",
    esEmpresaSocia: false,
    interes: "Data Analytics",
    estado: "Contactado",
  },
  {
    id: 3,
    fecha: "26 Feb 2026",
    nombre: "Juan Pablo Quispe",
    dni: "71029384",
    correo: "juan.pablo@hotmail.com",
    telefono: "+51 955 443 322",
    trabaja: false,
    empresa: "-",
    esEmpresaSocia: false,
    interes: "Desarrollo Web",
    estado: "Matriculado",
  },
  {
    id: 4,
    fecha: "25 Feb 2026",
    nombre: "Lucía Sofía Ramírez",
    dni: "76543210",
    correo: "lucia.ramirez@alicorp.com",
    telefono: "+51 933 221 100",
    trabaja: true,
    empresa: "Alicorp",
    esEmpresaSocia: true, // Aplica descuento
    interes: "Gestión de Proyectos",
    estado: "Pendiente",
  },
];

export default function TablaSolicitudesPersonas() {
  const [solicitudes] = useState(MOCK_SOLICITUDES_PERSONAS);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      {/* Encabezado y Filtros Estéticos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-[#0F2851]">
            Listado de Registros Personales
          </h2>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">
            Interesados desde el formulario público web
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por DNI, nombre o empresa..."
            className="bg-[#F8FAFC] border border-[#E2E8F0] text-xs rounded-xl px-4 py-2.5 text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] w-full sm:w-64 font-medium"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              <th className="pb-3 px-3">Fecha</th>
              <th className="pb-3 px-3">Postulante / DNI</th>
              <th className="pb-3 px-3">Contacto</th>
              <th className="pb-3 px-3">Situación Laboral</th>
              <th className="pb-3 px-3">Convenio Socia</th>
              <th className="pb-3 px-3">Interés</th>
              <th className="pb-3 px-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs font-medium text-[#0F2851]">
            {solicitudes.map((item) => (
              <tr key={item.id} className="hover:bg-[#F8FAFC] transition">
                <td className="py-4 px-3 whitespace-nowrap text-[#64748B] font-semibold">
                  {item.fecha}
                </td>
                <td className="py-4 px-3">
                  <p className="font-bold text-[#0F2851]">{item.nombre}</p>
                  <p className="text-[11px] text-[#64748B]">DNI: {item.dni}</p>
                </td>
                <td className="py-4 px-3">
                  <p className="font-semibold">{item.correo}</p>
                  <p className="text-[11px] text-[#64748B]">{item.telefono}</p>
                </td>
                <td className="py-4 px-3">
                  {item.trabaja ? (
                    <div>
                      <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md mb-0.5">
                        Laborando
                      </span>
                      <p className="text-[11px] font-bold text-[#0F2851]">{item.empresa}</p>
                    </div>
                  ) : (
                    <span className="text-[#94A3B8] font-semibold">No trabaja / Independiente</span>
                  )}
                </td>
                <td className="py-4 px-3">
                  {item.esEmpresaSocia ? (
                    <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#15803D] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#86EFAC]">
                      <span>🎉</span> Socio (Descuento)
                    </span>
                  ) : (
                    <span className="text-[#94A3B8] text-[11px] font-semibold">Sin Convenio</span>
                  )}
                </td>
                <td className="py-4 px-3 font-semibold text-[#0F2851]">{item.interes}</td>
                <td className="py-4 px-3 text-center">
                  <span
                    className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full ${
                      item.estado === "Pendiente"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : item.estado === "Contactado"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
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