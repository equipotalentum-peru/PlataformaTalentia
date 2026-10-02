export const PROFILE_PHOTO_UPDATED_EVENT = "talentia-profile-photo-updated";

export function notificarFotoPerfil(fotoPerfil: string | null) {
  window.dispatchEvent(
    new CustomEvent<string | null>(PROFILE_PHOTO_UPDATED_EVENT, { detail: fotoPerfil })
  );
}
