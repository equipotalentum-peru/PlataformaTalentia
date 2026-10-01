"use client";

import { useState } from "react";

type AddLinkModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, url: string) => void;
};

export default function AddLinkModal({ open, onClose, onSubmit }: AddLinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setTitle("");
    setUrl("");
    setError("");
    onClose();
  };

  const submit = () => {
    if (!title.trim() || !url.trim()) {
      setError("Completa ambos campos.");
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      setError("Ingresa una URL válida.");
      return;
    }

    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
      setError("La URL debe comenzar con http:// o https://.");
      return;
    }

    onSubmit(title.trim(), parsed.toString());
    close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="add-link-title">
      <div className="w-full max-w-[360px] rounded-xl bg-white px-5 pb-4 pt-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff7f7] text-[#06b4bd]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.14 1.14" />
                <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.14-1.14" />
              </svg>
            </div>
            <div>
              <h2 id="add-link-title" className="text-[14px] font-bold text-[#3186d8]">Subir Enlace</h2>
              <p className="text-[8px] text-[#54759a]">Añade un recurso externo a un recurso web.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="rounded-full p-1 text-[24px] leading-none text-gray-800 hover:bg-gray-100" aria-label="Cerrar">×</button>
        </div>

        <label className="mt-5 block text-[10px] font-semibold text-[#2a5b87]" htmlFor="link-title">Título del Enlace:</label>
        <input id="link-title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#c9cfd7] bg-white px-3 text-[11px] outline-none focus:border-[#3186d8] focus:ring-2 focus:ring-[#3186d8]/15" />

        <label className="mt-3 block text-[10px] font-semibold text-[#2a5b87]" htmlFor="link-url">URL del Enlace:</label>
        <div className="mt-1 flex h-9 items-center rounded-md border border-[#c9cfd7] bg-white">
          <div className="flex h-full w-9 items-center justify-center border-r border-[#e0e4eb] text-[#3186d8]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.14 1.14" />
              <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.14-1.14" />
            </svg>
          </div>
          <input id="link-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="http://..." className="min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none placeholder:text-[#9aa2ac]" />
        </div>

        {error && <p className="mt-2 text-center text-[9px] font-medium text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={close} className="h-8 rounded-md bg-[#efe6fa] px-4 text-[10px] font-semibold text-[#4b5fa7] hover:bg-[#e7dcf4]">Cancelar</button>
          <button type="button" onClick={submit} className="h-8 rounded-md bg-[#08489d] px-4 text-[10px] font-semibold text-white hover:bg-[#063e89]">Subir Enlace</button>
        </div>
      </div>
    </div>
  );
}
