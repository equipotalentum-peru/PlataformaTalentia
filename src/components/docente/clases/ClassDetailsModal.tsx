"use client";

import type { ClassSession } from "@/data/classes";

type ClassDetailsModalProps = {
  classSession: ClassSession | null;
  onClose: () => void;
  onViewRecording?: () => void;
};

function formatDateTime(value?: string | null) {
  if (!value) return "No registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(date);
}

function getSafeExternalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function DetailItem({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string | number;
  full?: boolean;
}) {
  return (
    <div className={`talentia-modal-detail-card ${full ? "sm:col-span-2" : ""}`}>
      <p className="talentia-modal-detail-label">{label}</p>
      <p className="talentia-modal-detail-value">{value}</p>
    </div>
  );
}

export default function ClassDetailsModal({
  classSession,
  onClose,
  onViewRecording,
}: ClassDetailsModalProps) {
  if (!classSession) return null;

  const zoomUrl = getSafeExternalUrl(classSession.zoomUrl);
  const recordingUrl = getSafeExternalUrl(classSession.recordingUrl);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-details-title"
        className="talentia-modal-panel w-full max-w-[680px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="talentia-modal-heading">
          <div className="min-w-0">
            <p className="mb-1 text-sm font-semibold text-talentia-blue">
              Detalles de la clase · Sesión {classSession.numero}
            </p>
            <h2 id="class-details-title" className="talentia-modal-title break-words">
              {classSession.tema}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="talentia-modal-close"
            aria-label="Cerrar detalles"
          >
            ×
          </button>
        </header>

        <div className="mb-4">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            classSession.estado === "Finalizada"
              ? "bg-talentia-success-bg text-talentia-success"
              : classSession.estado === "Cancelada"
                ? "bg-talentia-danger-bg text-talentia-danger"
                : classSession.estado === "En curso"
                  ? "bg-talentia-selected text-talentia-blue"
                  : "bg-talentia-warning-bg text-talentia-warning"
          }`}>
            {classSession.estado}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailItem label="Fecha y hora de inicio" value={formatDateTime(classSession.iniciaEn)} />
          <DetailItem label="Fecha y hora de término" value={formatDateTime(classSession.terminaEn)} />
          <DetailItem label="Docente" value={classSession.docente || "No asignado"} />
          <DetailItem
            label="Módulo"
            value={classSession.moduloTitulo || (classSession.moduloId ? `Módulo ${classSession.moduloId}` : "Sin módulo asignado")}
          />
          <DetailItem label="ID de la sesión" value={classSession.id} />
          <DetailItem label="Número de sesión" value={classSession.numero} />
          <DetailItem label="ID de la oferta del curso" value={classSession.ofertaCursoId ?? "No registrado"} />
          <DetailItem label="ID del módulo" value={classSession.moduloId ?? "No asignado"} />
          <DetailItem label="Creada en la base de datos" value={formatDateTime(classSession.creadoEn)} />
          <DetailItem label="Última actualización" value={formatDateTime(classSession.actualizadoEn)} />

          <div className="talentia-modal-detail-card sm:col-span-2">
            <p className="talentia-modal-detail-label">Enlace de Zoom guardado</p>
            {zoomUrl ? (
              <a className="break-all text-sm font-semibold text-talentia-blue underline underline-offset-2" href={zoomUrl} target="_blank" rel="noopener noreferrer">
                Abrir reunión de Zoom
              </a>
            ) : (
              <p className="talentia-modal-detail-value">No hay un enlace de Zoom guardado para esta clase.</p>
            )}
          </div>

          <div className="talentia-modal-detail-card sm:col-span-2">
            <p className="talentia-modal-detail-label">Grabación guardada</p>
            {recordingUrl ? (
              <a className="break-all text-sm font-semibold text-talentia-blue underline underline-offset-2" href={recordingUrl} target="_blank" rel="noopener noreferrer">
                Abrir grabación
              </a>
            ) : (
              <p className="talentia-modal-detail-value">No hay una URL de grabación almacenada directamente en el registro de la clase.</p>
            )}
          </div>
        </div>

        <footer className="talentia-modal-actions">
          {classSession.estado === "Finalizada" && onViewRecording && (
            <button
              type="button"
              onClick={onViewRecording}
              className="talentia-modal-button talentia-modal-button--secondary"
            >
              Consultar grabación en Zoom
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="talentia-modal-button talentia-modal-button--primary"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}
