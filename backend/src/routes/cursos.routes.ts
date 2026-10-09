import { Router } from "express";

import {
  obtenerMisCursos,
  obtenerMisCursosDocente,
  obtenerModulosCurso,
  completarContenidoEstudiante,
} from "../controllers/cursos.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { obtenerArchivoContenido } from "../controllers/contenido-archivo.controller";
import { subirArchivoContenido } from "../controllers/contenido-subida.controller";
import { gestionarContenido } from "../controllers/contenido-gestion.controller";
import { crearModulo, eliminarModulo } from "../controllers/modulos.controller";

const router = Router();
router.post("/:cursoId/modulos", requireAuth, crearModulo);
router.delete("/:cursoId/modulos/:moduloId", requireAuth, eliminarModulo);
router.patch("/:cursoId/contenidos/:contenidoId", requireAuth, gestionarContenido);
router.delete("/:cursoId/contenidos/:contenidoId", requireAuth, gestionarContenido);

router.post("/:cursoId/modulos/:moduloId/archivo", requireAuth, subirArchivoContenido);

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

router.post(
  "/:cursoId/contenidos/:contenidoId/progreso",
  requireAuth,
  completarContenidoEstudiante
);

router.get(
  "/:cursoId/contenidos/:contenidoId/archivo",
  requireAuth,
  obtenerArchivoContenido
);

export default router;
