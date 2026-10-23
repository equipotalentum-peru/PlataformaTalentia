import { Router } from "express";
import {
  obtenerMisCursos,
  obtenerMisCursosDocente,
  obtenerPeriodosAcademicosDocente,
  obtenerPeriodosAcademicosEstudiante,
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
import {
  enviarIntentoEvaluacionAlumno,
  iniciarIntentoEvaluacionAlumno,
  obtenerIntentosEvaluacionAlumno,
  obtenerDetalleIntentoEvaluacionAlumno,
  obtenerSeguimientoEvaluacionDocente,
  obtenerIntentosEvaluacionAlumnoDocente,
  obtenerDetalleIntentoEvaluacionDocente,
  calificarRespuestaEvaluacionDocente,
  descargarArchivoRespuestaEvaluacion,
} from "../controllers/evaluaciones-intentos.controller";
import { recibirArchivosEvaluacion } from "../middleware/evaluacion-upload.middleware";

const router = Router();

router.post("/:cursoId/modulos", requireAuth, crearModulo);
router.patch("/:cursoId/modulos/:moduloId", requireAuth, editarModulo);
router.delete("/:cursoId/modulos/:moduloId", requireAuth, eliminarModulo);
router.post("/:cursoId/modulos/:moduloId/evaluaciones", requireAuth, crearEvaluacionCurso);
router.patch("/:cursoId/modulos/:moduloId/evaluaciones/:contenidoId", requireAuth, editarEvaluacionCurso);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion", requireAuth, obtenerEvaluacionCurso);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion/intentos", requireAuth, obtenerIntentosEvaluacionAlumno);
router.post("/:cursoId/contenidos/:contenidoId/evaluacion/intentos/iniciar", requireAuth, iniciarIntentoEvaluacionAlumno);
router.post("/:cursoId/contenidos/:contenidoId/evaluacion/intentos/:intentoId/enviar", requireAuth, recibirArchivosEvaluacion, enviarIntentoEvaluacionAlumno);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion/intentos/:intentoId/detalle", requireAuth, obtenerDetalleIntentoEvaluacionAlumno);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion/archivo/:archivoId", requireAuth, descargarArchivoRespuestaEvaluacion);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion/docente/seguimiento", requireAuth, obtenerSeguimientoEvaluacionDocente);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion/docente/alumnos/:alumnoId/intentos", requireAuth, obtenerIntentosEvaluacionAlumnoDocente);
router.get("/:cursoId/contenidos/:contenidoId/evaluacion/docente/alumnos/:alumnoId/intentos/:intentoId/detalle", requireAuth, obtenerDetalleIntentoEvaluacionDocente);
router.patch("/:cursoId/contenidos/:contenidoId/evaluacion/docente/alumnos/:alumnoId/intentos/:intentoId/preguntas/:preguntaId/calificacion", requireAuth, calificarRespuestaEvaluacionDocente);
router.get("/:cursoId/modulos/:moduloId/evaluaciones/componentes-calificacion", requireAuth, listarComponentesCalificacionDocente);
router.patch("/:cursoId/contenidos/:contenidoId", requireAuth, gestionarContenido);
router.delete("/:cursoId/contenidos/:contenidoId", requireAuth, gestionarContenido);
router.post("/:cursoId/modulos/:moduloId/archivo", requireAuth, subirArchivoContenido);
router.get("/mis-cursos", requireAuth, obtenerMisCursos);
router.get("/periodos-academicos", requireAuth, obtenerPeriodosAcademicosEstudiante);
router.get("/docente/periodos-academicos", requireAuth, obtenerPeriodosAcademicosDocente);
router.get("/docente/mis-cursos", requireAuth, obtenerMisCursosDocente);
router.get("/:cursoId/modulos", requireAuth, obtenerModulosCurso);
router.post("/:cursoId/contenidos/:contenidoId/progreso", requireAuth, completarContenidoEstudiante);
router.get("/:cursoId/contenidos/:contenidoId/archivo", requireAuth, obtenerArchivoContenido);
router.get("/:cursoId/portada", requireAuth, obtenerPortadaCurso);

export default router;

