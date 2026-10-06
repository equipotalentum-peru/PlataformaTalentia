import { Router } from "express";

import {
  obtenerMisCalificaciones,
} from "../controllers/calificaciones.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/mis-calificaciones",
  requireAuth,
  obtenerMisCalificaciones
);

export default router;