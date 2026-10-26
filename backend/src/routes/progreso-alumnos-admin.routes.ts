import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../controllers/usuarios.controller";
import {
  activarCertificadoProgreso,
  descargarCertificadoProgreso,
  desactivarCertificadoProgreso,
  generarCertificadoProgreso,
  listarAlumnosProgreso,
  listarCursosProgreso,
  listarProgresoAlumnos,
} from "../controllers/progreso-alumnos-admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", listarProgresoAlumnos);
router.get("/cursos", listarCursosProgreso);
router.get("/alumnos", listarAlumnosProgreso);
router.get("/:matriculaId/certificados/:certificadoId/pdf", descargarCertificadoProgreso);
router.post("/:matriculaId/certificados", generarCertificadoProgreso);
router.patch("/:matriculaId/certificados/:certificadoId/desactivar", desactivarCertificadoProgreso);
router.patch("/:matriculaId/certificados/:certificadoId/activar", activarCertificadoProgreso);

export default router;
