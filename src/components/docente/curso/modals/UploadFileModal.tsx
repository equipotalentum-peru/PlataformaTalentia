"use client";

import { useRef, useState } from "react";

type UploadFileModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
};

const allowedExtensions = ["pdf", "docx", "pptx", "mp4"];

function isAllowed(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return allowedExtensions.includes(extension);
}

export default function UploadFileModal({ open, onClose, onSubmit }: UploadFileModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const pickFile = (file?: File) => {
    if (uploading) return;
    if (!file) return;
    if (!isAllowed(file)) {
      setSelectedFile(null);
      setError("Formato no permitido.");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setSelectedFile(null);
      setError("El archivo supera los 200 MB.");
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const reset = () => {
    setSelectedFile(null);
    setError("");
    setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (uploading) return;
    if (!selectedFile) {
      setError("Selecciona un archivo para continuar.");
      return;
    }
    setUploading(true);
    setError("");
    try { await onSubmit(selectedFile); reset(); }
    catch (error) { setError(error instanceof Error ? error.message : "No se pudo subir el archivo."); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="upload-file-title">
      <div className="max-h-[calc(100dvh-4rem)] w-full max-w-[480px] overflow-y-auto rounded-xl bg-talentia-surface px-4 pb-4 pt-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-talentia-selected text-talentia-blue">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            </div>
            <div>
              <h2 id="upload-file-title" className="text-[15px] font-bold text-talentia-primary">Insertar archivo</h2>
              <p className="text-[13px] text-talentia-muted">Sube un documento, presentación o video.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="rounded-full p-1 text-[24px] leading-none text-talentia-primary hover:bg-talentia-hover" aria-label="Cerrar">×</button>
        </div>

        <div
          className={`mt-4 rounded-md border border-talentia-border bg-talentia-surface px-4 py-5 text-center transition ${dragging ? "border-talentia-blue bg-talentia-selected" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
          onDrop={(event) => { event.preventDefault(); setDragging(false); pickFile(event.dataTransfer.files?.[0]); }}
        >
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-talentia-blue" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
          </svg>
          <p className="mt-2 text-[13px] text-talentia-primary">Arrastra y suelta el archivo aquí</p>
          <p className="text-[13px] text-talentia-primary">o</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-1 rounded-md border border-talentia-blue bg-talentia-surface px-3 py-1.5 text-[13px] font-semibold text-talentia-blue hover:bg-talentia-hover">
            Seleccionar archivo
          </button>
          {selectedFile && <p className="mt-2 truncate text-[13px] font-semibold text-talentia-blue">{selectedFile.name}</p>}
          <p className="mt-2 text-[12px] text-talentia-muted">Tamaño máximo: 200 MB</p>
          <p className="mt-1 text-[12px] text-talentia-muted">Formatos permitidos: PDF, DOCX, PPTX, MP4</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.pptx,.mp4"
          disabled={uploading}
          onChange={(event) => pickFile(event.target.files?.[0])}
        />

        {error && <p role="alert" className="mt-2 text-center text-[13px] font-medium text-talentia-danger">{error}</p>}

        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={close} className="h-8 rounded-md bg-talentia-surface px-4 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-border">Cancelar</button>
          <button type="button" onClick={() => void submit()} disabled={uploading} className="h-8 rounded-md bg-talentia-action px-4 text-[13px] font-semibold text-white hover:bg-talentia-primary disabled:opacity-50">{uploading ? "Subiendo..." : "Subir archivo"}</button>
        </div>
      </div>
    </div>
  );
}
