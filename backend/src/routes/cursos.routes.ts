import { Router } from "express";

import {
  obtenerMisCursos,
  obtenerMisCursosDocente,
  obtenerModulosCurso,
} from "../controllers/cursos.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { obtenerArchivoContenido } from "../controllers/contenido-archivo.controller";

const router = Router();

router.get(
  "/mis-cursos",
  requireAuth,
  obtenerMisCursos
);

// Debe declararse antes de las rutas con parámetro (/:cursoId/...)
router.get(
  "/docente/mis-cursos",
  requireAuth,
  obtenerMisCursosDocente
);

router.get(
  "/:cursoId/modulos",
  requireAuth,
  obtenerModulosCurso
);

router.get(
  "/:cursoId/contenidos/:contenidoId/archivo",
  requireAuth,
  obtenerArchivoContenido
);

export default router;
