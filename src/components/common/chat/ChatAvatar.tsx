
"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  initials: string;
  name: string;
  className: string;
  shape?: "circle" | "rounded";
};

export default function ChatAvatar({
  src,
  initials,
  name,
  className,
  shape = "circle",
}: Props) {
  const [fotoFallida, setFotoFallida] = useState<string | null>(null);

  const mostrarFoto = Boolean(src && fotoFallida !== src);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-semibold text-white ${
        shape === "circle" ? "rounded-full" : "rounded-xl"
      } ${className}`}
    >
      {mostrarFoto ? (
        <img
          src={src!}
          alt={`Foto de ${name}`}
          draggable={false}
          onError={() => setFotoFallida(src ?? null)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            height: "100%",
            width: "100%",
            maxWidth: "none",
          }}
        />
      ) : (
        initials || name.trim().charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}
