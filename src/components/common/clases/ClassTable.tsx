import type { ClassSession } from "@/data/classes";
import ClassStatus from "./ClassStatus";

type ClassTableProps = {
  classes: ClassSession[];
  role: "student" | "teacher";
  onEdit?: (classSession: ClassSession) => void;
  onCancel?: (classSession: ClassSession) => void;
  onStart?: (classSession: ClassSession) => void;
  onDetails?: (classSession: ClassSession) => void;
};

function VideoIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
      />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m4 17 1-4L15 3l4 4-10 10-5 1Z" />
      <path d="m13 5 4 4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  );
}

export default function ClassTable({
  classes,
  role,
  onEdit,
  onCancel,
  onStart,
  onDetails,
}: ClassTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-[10px]">
        <thead>
          <tr className="bg-[#f1f1f1]">
            <th className="px-4 py-2.5 font-semibold text-gray-800">
              Sesión
            </th>

            <th className="px-4 py-2.5 font-semibold text-gray-800">
              Tema
            </th>

            <th className="px-4 py-2.5 font-semibold text-gray-800">
              Fecha y Hora
            </th>

            <th className="px-4 py-2.5 font-semibold text-gray-800">
              Estado
            </th>

            {role === "teacher" && (
              <th className="px-4 py-2.5 font-semibold text-gray-800">
                Grabación
              </th>
            )}

            <th className="px-4 py-2.5 font-semibold text-gray-800">
              Acción
            </th>
          </tr>
        </thead>

        <tbody>
          {classes.map((item) => {
            const finished = item.estado === "Finalizada";
            const upcoming = item.estado === "Próxima";
            const scheduled = item.estado === "Programada";

            return (
              <tr
                key={item.id}
                className="border-t border-gray-200"
              >
                <td className="px-4 py-2.5 text-gray-700">
                  {item.numero}
                </td>

                <td className="px-4 py-2.5 font-medium text-gray-800">
                  {item.tema}
                </td>

                <td className="px-4 py-2.5">
                  <div className="font-medium text-gray-700">
                    {item.fecha}
                  </div>

                  <div className="text-[9px] text-gray-400">
                    {item.horario}
                  </div>
                </td>

                <td className="px-4 py-2.5">
                  <ClassStatus status={item.estado} />
                </td>

                {role === "teacher" && (
                  <td className="px-4 py-2.5">
                    {finished ? (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-md bg-[#00bbb6] px-3 py-1.5 text-[9px] font-medium text-white transition hover:bg-[#00a7a2]"
                      >
                        <VideoIcon />
                        Ver grabación
                      </button>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                )}

                <td className="px-4 py-2.5">
                  {role === "teacher" ? (
                    <>
                      {finished && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onDetails?.(item)}
                            className="flex items-center gap-1 rounded-md bg-[#dbeefa] px-3 py-1.5 text-[9px] font-medium text-[#3186d8]"
                          >
                            Ver detalles
                          </button>

                          <button
                            type="button"
                            onClick={() => onDetails?.(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#dbeefa] text-[#3186d8]"
                            aria-label="Más acciones"
                          >
                            <MoreIcon />
                          </button>
                        </div>
                      )}

                      {upcoming && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(item)}
                          className="flex items-center gap-1.5 rounded-md bg-[#dbeefa] px-3 py-1.5 text-[9px] font-medium text-[#3186d8]"
                        >
                          <EditIcon />
                          Editar
                        </button>
                      )}

                      {scheduled && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(item)}
                          className="flex items-center gap-1.5 rounded-md bg-[#dbeefa] px-3 py-1.5 text-[9px] font-medium text-[#3186d8]"
                        >
                          <EditIcon />
                          Editar
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {finished && (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md bg-[#3186d8] px-3 py-1.5 text-[9px] font-medium text-white"
                        >
                          <VideoIcon />
                          Ver grabación
                        </button>
                      )}

                      {upcoming && (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md bg-[#3186d8] px-3 py-1.5 text-[9px] font-medium text-white"
                        >
                          <VideoIcon />
                          Unirse por Zoom
                        </button>
                      )}

                      {scheduled && (
                        <button
                          type="button"
                          disabled
                          className="flex items-center gap-1.5 rounded-md bg-gray-300 px-3 py-1.5 text-[9px] font-medium text-gray-500"
                        >
                          <VideoIcon />
                          Unirse por Zoom
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}