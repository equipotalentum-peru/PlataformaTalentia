import { API_URL } from "@/lib/api";

export type RubricInfo = {
  id: number;
  titulo: string;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
  criterios: { id: number; nombre: string; descripcion: string | null; puntaje_maximo: number | string }[];
};

export default function RubricDetails({ rubrica, courseId, contentId }: {
  rubrica: RubricInfo | null; courseId: number; contentId: number;
}) {
  if (!rubrica) return null;
  return (
    <section className="my-5 border-y border-gray-200 py-4">
      <h2 className="mb-3 font-semibold text-[#3186d8]">Rúbrica de evaluación</h2>
      {rubrica.ruta_archivo ? (
        <a href={`${API_URL}/actividades/${courseId}/${contentId}/rubrica`} target="_blank" rel="noreferrer"
          className="break-all text-sm text-blue-700 underline">
          Descargar {rubrica.nombre_archivo || "rúbrica PDF"}
        </a>
      ) : (
        <ul className="divide-y divide-gray-200">
          {rubrica.criterios.map(criterion => (
            <li key={criterion.id} className="py-2 text-sm text-gray-700">
              <div className="flex items-start justify-between gap-4">
                <span className="min-w-0 break-words font-medium">{criterion.nombre}</span>
                <span className="shrink-0">{Number(criterion.puntaje_maximo)} puntos</span>
              </div>
              {criterion.descripcion && <p className="mt-1 whitespace-pre-wrap break-words">{criterion.descripcion}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
