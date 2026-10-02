"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";

type Props = {
  fotoPerfil: string | null;
  nombre: string;
  children: ReactNode;
};

export default function SidebarAvatar({ fotoPerfil, nombre, children }: Props) {
  const [fotoFallida, setFotoFallida] = useState<string | null>(null);

  if (!fotoPerfil || fotoPerfil === fotoFallida) return children;

  return (
    <Image
      src={fotoPerfil}
      alt={`Foto de perfil de ${nombre}`}
      width={40}
      height={40}
      unoptimized
      onError={() => setFotoFallida(fotoPerfil)}
      className="h-full w-full object-cover"
    />
  );
}
