"use client";

import { useRef, useState } from "react";

type UploadFileModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
};

const allowedExtensions = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "png", "jpg", "jpeg", "rar", "zip"];

function isAllowed(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return allowedExtensions.includes(extension);
}

export default function UploadFileModal({ open, onClose, onSubmit }: UploadFileModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const pickFile = (file?: File) => {
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
    reset();
    onClose();
  };

  const submit = () => {
    if (!selectedFile) {
      setError("Selecciona un archivo para continuar.");
      return;
    }
    onSubmit(selectedFile);
    reset();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="upload-file-title">
      <div className="w-full max-w-[365px] rounded-xl bg-white px-4 pb-4 pt-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9eaff] text-[#3186d8]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            </div>
            <div>
              <h2 id="upload-file-title" className="text-[14px] font-bold text-[#3186d8]">Insertar archivo</h2>
              <p className="text-[8px] text-[#54759a]">Sube un documento, presentación, hoja de cálculo u otros.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="rounded-full p-1 text-[24px] leading-none text-gray-800 hover:bg-gray-100" aria-label="Cerrar">×</button>
        </div>

        <div
          className={`mt-4 rounded-md border border-[#bfc6ce] bg-[#f3f3f3] px-4 py-5 text-center transition ${dragging ? "border-[#3186d8] bg-[#eaf4ff]" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
          onDrop={(event) => { event.preventDefault(); setDragging(false); pickFile(event.dataTransfer.files?.[0]); }}
        >
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-[#3186d8]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
          </svg>
          <p className="mt-2 text-[9px] text-gray-600">Arrastra y suelta el archivo aquí</p>
          <p className="text-[9px] text-gray-600">o</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-1 rounded-md border border-[#3186d8] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#3186d8] hover:bg-[#eaf4ff]">
            Seleccionar archivo
          </button>
          {selectedFile && <p className="mt-2 truncate text-[9px] font-semibold text-[#1d5b92]">{selectedFile.name}</p>}
          <p className="mt-2 text-[6.5px] text-gray-500">Tamaño máximo: 200 MB</p>
          <p className="mt-1 text-[6.5px] text-gray-500">Formatos permitidos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG, RAR, ZIP</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.rar,.zip"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />

        {error && <p className="mt-2 text-center text-[9px] font-medium text-red-600">{error}</p>}

        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={close} className="h-8 rounded-md bg-[#efe6fa] px-4 text-[10px] font-semibold text-[#4b5fa7] hover:bg-[#e7dcf4]">Cancelar</button>
          <button type="button" onClick={submit} className="h-8 rounded-md bg-[#08489d] px-4 text-[10px] font-semibold text-white hover:bg-[#063e89]">Subir archivo</button>
        </div>
      </div>
    </div>
  );
}
