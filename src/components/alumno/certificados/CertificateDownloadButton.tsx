"use client";

import {
  useState,
} from "react";

import {
  API_URL,
} from "@/lib/api";

type Props = {
  certificadoId: number;
  fileName: string;
  className: string;
  label?: string;
};

export default function CertificateDownloadButton({
  certificadoId,
  fileName,
  className,
  label = "Descargar",
}: Props) {
  const [
    descargando,
    setDescargando,
  ] =
    useState(false);

  async function descargar() {
    if (
      descargando
    ) {
      return;
    }

    try {
      setDescargando(true);

      const response =
        await fetch(
          `${API_URL}/certificados/${certificadoId}/pdf`,
          {
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

    } catch (error) {

      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el certificado."
      );

    } finally {
      setDescargando(false);
    }
  }

  return (
    <button
      type="button"

      onClick={() =>
        void descargar()
      }

      disabled={
        descargando
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