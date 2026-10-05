import { Router } from "express";

import { obtenerMisCursos } from "../controllers/cursos.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/mis-cursos",
  requireAuth,
  obtenerMisCursos
);

export default router;