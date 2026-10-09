import { Router } from "express";

import {
  obtenerCursosChat,
  obtenerContactosChat,
  obtenerMensajesChat,
  enviarMensajeChat,
  enviarAdjuntoChat,
  marcarChatLeido,
  descargarAdjuntoChat,
  editarMensajeChat,
  eliminarMensajeChat,
} from "../controllers/chat.controller";

import { requireAuth } from "../middleware/auth.middleware";

import {
  recibirAdjuntoChat,
} from "../middleware/chat-upload.middleware";

const router = Router();

router.get(
  "/cursos",
  requireAuth,
  obtenerCursosChat
);

router.get(
  "/cursos/:cursoId/contactos",
  requireAuth,
  obtenerContactosChat
);

router.get(
  "/cursos/:cursoId/contactos/:contactoId/mensajes",
  requireAuth,
  obtenerMensajesChat
);

router.post(
  "/cursos/:cursoId/contactos/:contactoId/mensajes",
  requireAuth,
  enviarMensajeChat
);

router.post(
  "/cursos/:cursoId/contactos/:contactoId/adjuntos",
  requireAuth,
  recibirAdjuntoChat.single(
    "archivo"
  ),
  enviarAdjuntoChat
);

router.post(
  "/cursos/:cursoId/contactos/:contactoId/leido",
  requireAuth,
  marcarChatLeido
);

router.get(
  "/adjuntos/:adjuntoId",
  requireAuth,
  descargarAdjuntoChat
);

router.patch(
  "/cursos/:cursoId/contactos/:contactoId/mensajes/:mensajeId",
  requireAuth,
  editarMensajeChat
);

router.delete(
  "/cursos/:cursoId/contactos/:contactoId/mensajes/:mensajeId",
  requireAuth,
  eliminarMensajeChat
);

export default router;