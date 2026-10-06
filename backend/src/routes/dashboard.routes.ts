import { Router } from "express";

import {
  obtenerDashboardEstudiante,
} from "../controllers/dashboard.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/estudiante",
  requireAuth,
  obtenerDashboardEstudiante
);

export default router;