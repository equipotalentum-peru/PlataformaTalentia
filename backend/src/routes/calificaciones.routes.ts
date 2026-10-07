import { Router } from "express";

import {
  obtenerMisCalificaciones,
} from "../controllers/calificaciones.controller";

import {
  obtenerCalificacionesDocente,
  guardarCalificacionDocente,
} from "../controllers/calificaciones-docente.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

const router = Router();

/*Caificaciones del estudiante*/

router.get(
  "/mis-calificaciones",
  requireAuth,
  obtenerMisCalificaciones
);

/*Calificaciones del Docente*/

router.get(
  "/docente/mis-calificaciones",
  requireAuth,
  obtenerCalificacionesDocente
);

router.put(
  "/docente/calificaciones",
  requireAuth,
  guardarCalificacionDocente
);

export default router;