"use client";

type CreateModuleModalProps = {
  open: boolean;
  value: string;
  saving?: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function CreateModuleModal({
  open,
  value,
  saving = false,
  onChange,
  onClose,
  onSave,
}: CreateModuleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="create-module-title">
      <div className="w-full max-w-[355px] rounded-xl bg-talentia-surface px-5 pb-5 pt-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="create-module-title" className="text-[17px] font-bold text-talentia-primary">Crear Modulo</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[28px] leading-none text-talentia-primary transition hover:bg-talentia-hover" aria-label="Cerrar">
            ×
          </button>
        </div>

        <label className="mt-4 block text-[11px] font-semibold text-talentia-primary" htmlFor="module-title">
          Título:
        </label>
        <input
          id="module-title"
          maxLength={200}
          disabled={saving}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
          className="mt-2 h-9 w-full rounded-md border border-talentia-border bg-talentia-surface px-3 text-[12px] text-talentia-primary outline-none focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
          type="button"
          disabled={saving}
          onClick={() => onSave()}
          className="h-9 rounded-md bg-talentia-action text-[12px] font-semibold text-white transition hover:bg-talentia-primary">Publicar
          </button>
        <button type="button" onClick={onClose} className="flex h-9 items-center justify-center rounded-md bg-talentia-surface text-[12px] font-semibold text-talentia-primary transition hover:bg-talentia-border">
          Cancelar
        </button>
        </div>
      </div>
    </div>
  );
}
