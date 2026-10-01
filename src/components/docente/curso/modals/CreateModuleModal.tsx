"use client";

type CreateModuleModalProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: (status: "Borrador" | "Publicado") => void;
};

export default function CreateModuleModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
}: CreateModuleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="create-module-title">
      <div className="w-full max-w-[355px] rounded-xl bg-white px-5 pb-5 pt-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="create-module-title" className="text-[17px] font-bold text-[#3186d8]">Crear Modulo</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[28px] leading-none text-[#222] transition hover:bg-gray-100" aria-label="Cerrar">
            ×
          </button>
        </div>

        <label className="mt-4 block text-[11px] font-semibold text-[#222]" htmlFor="module-title">
          Título:
        </label>
        <input
          id="module-title"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
          className="mt-2 h-9 w-full rounded-md border border-[#e0e4eb] bg-[#f4f4f4] px-3 text-[12px] text-gray-800 outline-none focus:border-[#3186d8] focus:ring-2 focus:ring-[#3186d8]/15"
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onSave("Borrador")} className="h-9 rounded-md bg-[#dceef9] text-[12px] font-semibold text-[#3186d8] transition hover:bg-[#cce5f5]">
            Borrador
          </button>
          <button type="button" onClick={() => onSave("Publicado")} className="h-9 rounded-md bg-[#08489d] text-[12px] font-semibold text-white transition hover:bg-[#063e89]">
            Publicar
          </button>
        </div>

        <button type="button" onClick={onClose} className="mx-auto mt-3 flex h-9 w-[102px] items-center justify-center rounded-md bg-[#efe6fa] text-[12px] font-semibold text-[#4b5fa7] transition hover:bg-[#e8ddf4]">
          Cancelar
        </button>
      </div>
    </div>
  );
}
