import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  actualizarCursoAdministrador,
  cambiarEstadoCursoAdministrador,
  crearCursoAdministrador,
  listarCursosAdministrador,
  listarDocentesAdministrador,
  obtenerCursoAdministrador,
  recibirImagenPortada,
} from "../controllers/cursos-admin.controller";
import {
  cambiarEstadoPublicacionCurso,
  eliminarPublicacionCurso,
  guardarFichaPublicaCurso,
  listarEstadosPublicacionCursos,
  obtenerFichaPublicaCurso,
} from "../controllers/cursos-publicacion.controller";

const router = Router();

router.get("/docentes", requireAuth, listarDocentesAdministrador);
router.get("/", requireAuth, listarCursosAdministrador);
router.get("/publicaciones-talentia/estados", requireAuth, listarEstadosPublicacionCursos);
router.get("/:cursoId", requireAuth, obtenerCursoAdministrador);
router.get("/:cursoId/publicacion-talentia", requireAuth, obtenerFichaPublicaCurso);
router.put("/:cursoId/publicacion-talentia", requireAuth, recibirImagenPortada, guardarFichaPublicaCurso);
router.patch("/:cursoId/publicacion-talentia/estado", requireAuth, cambiarEstadoPublicacionCurso);
router.delete("/:cursoId/publicacion-talentia", requireAuth, eliminarPublicacionCurso);
router.post( "/", requireAuth, recibirImagenPortada, crearCursoAdministrador);
router.patch("/:cursoId/estado", requireAuth, cambiarEstadoCursoAdministrador);
router.patch("/:cursoId", requireAuth, recibirImagenPortada, actualizarCursoAdministrador);

export default router;
