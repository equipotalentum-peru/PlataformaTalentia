import { Router } from "express";

import {
  obtenerMisCursos,
  obtenerModulosCurso,
} from "../controllers/cursos.controller";

import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/mis-cursos",
  requireAuth,
  obtenerMisCursos
);

router.get(
  "/:cursoId/modulos",
  requireAuth,
  obtenerModulosCurso
);

export default router;