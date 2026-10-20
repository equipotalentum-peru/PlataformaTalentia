"use client";

type CreateModuleModalProps = {
  open: boolean;
  value: string;
  saving?: boolean;
  title?: string;
  submitLabel?: string;
  error?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function CreateModuleModal({
  open,
  value,
  saving = false,
  title = "Crear Modulo",
  submitLabel = "Publicar",
  error,
  onChange,
  onClose,
  onSave,
}: CreateModuleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="create-module-title">
      <div className="w-full max-w-[355px] rounded-xl bg-talentia-surface px-5 pb-5 pt-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="create-module-title" className="text-[15px] font-bold text-talentia-primary">{title}</h2>
          <button type="button" disabled={saving} onClick={onClose} className="rounded-full p-1 text-[28px] leading-none text-talentia-primary transition hover:bg-talentia-hover" aria-label="Cerrar">
            ×
          </button>
        </div>

        <label className="mt-4 block text-[13px] font-semibold text-talentia-primary" htmlFor="module-title">
          Título:
        </label>
        <input
          id="module-title"
          maxLength={200}
          disabled={saving}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "module-title-error" : undefined}
          className="mt-2 h-9 w-full rounded-md border border-talentia-border bg-talentia-surface px-3 text-[13px] text-talentia-primary outline-none focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
        />

        {error && <p id="module-title-error" role="alert" className="mt-2 text-[13px] text-talentia-danger">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
          type="button"
          disabled={saving}
          onClick={() => onSave()}
          className="h-9 rounded-md bg-talentia-action text-[13px] font-semibold text-white transition hover:bg-talentia-primary">{saving ? "Guardando..." : submitLabel}
          </button>
        <button type="button" disabled={saving} onClick={onClose} className="flex h-9 items-center justify-center rounded-md bg-talentia-surface text-[13px] font-semibold text-talentia-primary transition hover:bg-talentia-border">
          Cancelar
        </button>
        </div>
      </div>
    </div>
  );
}
