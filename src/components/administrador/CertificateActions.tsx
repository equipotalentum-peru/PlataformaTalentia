"use client";

import { useEffect, useId, useRef, useState } from "react";
import CertificateDownloadButton from "@/components/alumno/certificados/CertificateDownloadButton";
import { API_URL } from "@/lib/api";

type Props = {
  matriculaId: string;
  alumno: string;
  codigoCurso: string;
  codigoAlumno: string;
  certificado: { id: string; numero: string; disponible: boolean; visibleAlumno: boolean } | null;
  puedeGenerar: boolean;
  onChanged: () => void;
};

const actionClass = "flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium text-talentia-primary hover:bg-talentia-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:opacity-60 [&_svg]:shrink-0";

export default function CertificateActions({ matriculaId, alumno, codigoCurso, codigoAlumno, certificado, puedeGenerar, onChanged }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const activar = certificado?.visibleAlumno === false;
  const accionVisibilidad = activar ? "Activar" : "Desactivar";
  const hayAcciones = puedeGenerar || Boolean(certificado);
  const base = `/administrador/progreso-alumnos/${matriculaId}/certificados`;

  useEffect(() => {
    if (!confirming) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [confirming]);

  async function cambiarVisibilidad() {
    if (busy || !certificado) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}${base}/${certificado.id}/${activar ? "activar" : "desactivar"}`, { method: "PATCH", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? `No se pudo ${activar ? "activar" : "desactivar"} el certificado.`);
      setConfirming(false);
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : `No se pudo ${activar ? "activar" : "desactivar"} el certificado.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Acciones de certificado de ${alumno}`}
        aria-expanded={open}
        aria-controls={`${id}-acciones`}
        disabled={busy || !hayAcciones}
        title={certificado?.visibleAlumno === false ? "Certificado desactivado para el alumno" : !hayAcciones ? "Requiere promedio mínimo de 14" : "Acciones de certificado"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-talentia-muted hover:bg-talentia-selected hover:text-talentia-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:opacity-50"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({ top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 160)), left: Math.max(8, Math.min(rect.right - 240, window.innerWidth - 248)) });
          setError("");
          menuRef.current?.togglePopover();
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
      </button>
      <div
        ref={menuRef}
        id={`${id}-acciones`}
        popover="auto"
        onToggle={(event) => setOpen(event.newState === "open")}
        onClick={() => menuRef.current?.hidePopover()}
        aria-label="Acciones de certificado"
        style={{ position: "fixed", top: position.top, left: position.left, margin: 0 }}
        className="w-60 rounded-lg border border-talentia-border bg-talentia-surface p-1.5 shadow-lg"
      >
        {puedeGenerar && <CertificateDownloadButton certificadoId={matriculaId} rutaDescarga={base} method="POST" label="Generar certificado" fileName={`${certificado?.numero ?? `Certificado-${codigoCurso}-${codigoAlumno}`}.pdf`} className={actionClass} disabled={busy} onBusyChange={setBusy} onDownloaded={onChanged} onError={setError} />}
        {certificado && <button type="button" disabled={busy} className={actionClass} onClick={() => { setError(""); setConfirming(true); }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">{activar ? <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></> : <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 5.2A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-3 3.7M6.4 6.4A19 19 0 0 0 2 12s4 7 10 7a11 11 0 0 0 5.6-1.6" />}</svg>
          {`${accionVisibilidad} certificado`}
        </button>}
      </div>
      {error && !confirming && <p role="alert" className="mt-2 text-[12px] text-talentia-danger">{error}</p>}
      {confirming && <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-descripcion`}
        onCancel={(event) => { if (busy) event.preventDefault(); }}
        onClose={(event) => { if (!event.currentTarget.open && !busy) setConfirming(false); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-talentia-border bg-talentia-surface p-6 text-left text-talentia-primary shadow-xl backdrop:bg-talentia-primary/40"
      >
        <h2 id={`${id}-titulo`} className="text-lg font-bold">{accionVisibilidad} certificado</h2>
        <p id={`${id}-descripcion`} className="mt-3 text-[13px] leading-6">El certificado de <strong>{alumno}</strong> {activar ? "volverá a estar visible y disponible para descargar desde su cuenta, si cumple los requisitos académicos." : "dejará de estar visible y disponible para descargar desde su cuenta. El certificado y sus notas se conservarán."}</p>
        {error && <p role="alert" className="mt-3 text-[13px] text-talentia-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" autoFocus disabled={busy} onClick={() => setConfirming(false)} className="h-10 rounded-md border border-talentia-border px-4 text-[13px] font-semibold hover:bg-talentia-hover disabled:opacity-50">Cancelar</button>
          <button type="button" disabled={busy} onClick={() => void cambiarVisibilidad()} className="h-10 rounded-md bg-talentia-action px-4 text-[13px] font-semibold text-white hover:brightness-95 disabled:opacity-50">{busy ? activar ? "Activando..." : "Desactivando..." : accionVisibilidad}</button>
        </div>
      </dialog>}
    </>
  );
}
