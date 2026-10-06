import { Router } from "express";

import {
  cambiarEstadoAnuncio,
  crearAnuncio,
  editarAnuncio,
  eliminarAnuncio,
  listarAnunciosCurso,
  marcarAnuncioLeido,
} from "../controllers/anuncios.controller";

import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/cursos/:cursoId/anuncios",
  requireAuth,
  listarAnunciosCurso
);

router.post(
  "/cursos/:cursoId/anuncios",
  requireAuth,
  crearAnuncio
);

router.patch(
  "/anuncios/:anuncioId/estado",
  requireAuth,
  cambiarEstadoAnuncio
);

router.post(
  "/anuncios/:anuncioId/lectura",
  requireAuth,
  marcarAnuncioLeido
);

router.patch(
  "/anuncios/:anuncioId",
  requireAuth,
  editarAnuncio
);

router.delete(
  "/anuncios/:anuncioId",
  requireAuth,
  eliminarAnuncio
);

export default router;