
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

const router = Router();

router.get("/docentes", requireAuth, listarDocentesAdministrador);
router.get("/", requireAuth, listarCursosAdministrador);
router.get("/:cursoId", requireAuth, obtenerCursoAdministrador);
router.post( "/", requireAuth, recibirImagenPortada, crearCursoAdministrador);
router.patch("/:cursoId/estado", requireAuth, cambiarEstadoCursoAdministrador);
router.patch("/:cursoId", requireAuth, recibirImagenPortada, actualizarCursoAdministrador);

export default router;
