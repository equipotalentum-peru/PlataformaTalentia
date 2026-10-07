import { Router } from "express";

import {
  obtenerDashboardEstudiante,
} from "../controllers/dashboard.controller";

import {
  obtenerDashboardDocente,
} from "../controllers/docente-dashboard.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/estudiante",
  requireAuth,
  obtenerDashboardEstudiante
);

router.get(
  "/docente",
  requireAuth,
  obtenerDashboardDocente
);

export default router;