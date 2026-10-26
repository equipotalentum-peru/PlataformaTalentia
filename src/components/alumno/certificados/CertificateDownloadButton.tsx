"use client";

import {
  useState,
} from "react";

import {
  API_URL,
} from "@/lib/api";

type Props = {
  certificadoId: number | string;
  rutaDescarga?: string;
  fileName: string;
  className: string;
  label?: string;
  method?: "GET" | "POST";
  disabled?: boolean;
  onDownloaded?: () => void;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

export default function CertificateDownloadButton({
  certificadoId,
  rutaDescarga,
  fileName,
  className,
  label = "Descargar",
  method = "GET",
  disabled = false,
  onDownloaded,
  onError,
  onBusyChange,
}: Props) {
  const [
    descargando,
    setDescargando,
  ] =
    useState(false);

  async function descargar() {
    if (
      descargando || disabled
    ) {
      return;
    }

    try {
      setDescargando(true);
      onBusyChange?.(true);

      const response =
        await fetch(
          `${API_URL}${rutaDescarga ?? `/certificados/${certificadoId}/pdf`}`,
          {
            method,
            credentials:
              "include",
          }
        );

      if (
        !response.ok
      ) {
        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        throw new Error(
          data.message ??
            "No se pudo descargar el certificado."
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;
      link.download =
        fileName;

      document.body
        .appendChild(link);

      link.click();
      link.remove();

      URL.revokeObjectURL(
        url
      );
      onDownloaded?.();

    } catch (error) {

      const message = error instanceof Error
          ? error.message
          : "No se pudo descargar el certificado.";
      if (onError) onError(message);
      else window.alert(message);

    } finally {
      setDescargando(false);
      onBusyChange?.(false);
    }
  }

  return (
    <button
      type="button"

      onClick={() =>
        void descargar()
      }

      disabled={
        descargando || disabled
      }

      className={
        className
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>

      {descargando
        ? "Descargando..."
        : label}
    </button>
  );
}
