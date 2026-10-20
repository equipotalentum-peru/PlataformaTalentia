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
import { crearModulo, editarModulo, eliminarModulo } from "../controllers/modulos.controller";
import { obtenerPortadaCurso } from "../controllers/cursos-admin.controller";
import {
  crearEvaluacionCurso,
  editarEvaluacionCurso,
  listarComponentesCalificacionDocente,
  obtenerEvaluacionCurso,
} from "../controllers/evaluaciones-gestion.controller";

const router = Router();

router.post("/:cursoId/modulos", requireAuth, crearModulo);
router.patch("/:cursoId/modulos/:moduloId", requireAuth, editarModulo);
router.delete("/:cursoId/modulos/:moduloId", requireAuth, eliminarModulo);
router.post("/:cursoId/modulos/:moduloId/evaluaciones", requireAuth, crearEvaluacionCurso);
router.patch("/:cursoId/modulos/:moduloId/evaluaciones/:contenidoId", requireAuth, editarEvaluacionCurso);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion", requireAuth, obtenerEvaluacionCurso);
router.get("/:cursoId/modulos/:moduloId/evaluaciones/componentes-calificacion", requireAuth, listarComponentesCalificacionDocente);
router.patch("/:cursoId/contenidos/:contenidoId", requireAuth, gestionarContenido);
router.delete("/:cursoId/contenidos/:contenidoId", requireAuth, gestionarContenido);
router.post("/:cursoId/modulos/:moduloId/archivo", requireAuth, subirArchivoContenido);
router.get("/mis-cursos", requireAuth, obtenerMisCursos);
router.get("/docente/mis-cursos", requireAuth, obtenerMisCursosDocente);
router.get("/:cursoId/modulos", requireAuth, obtenerModulosCurso);
router.post("/:cursoId/contenidos/:contenidoId/progreso", requireAuth, completarContenidoEstudiante);
router.get("/:cursoId/contenidos/:contenidoId/archivo", requireAuth, obtenerArchivoContenido);
router.get("/:cursoId/portada", requireAuth, obtenerPortadaCurso);

export default router;
