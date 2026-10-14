import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  crearCursoAdministrador,
  listarCursosAdministrador,
  listarDocentesAdministrador,
  recibirImagenPortada,
} from "../controllers/cursos-admin.controller";

const router = Router();

router.get("/docentes", requireAuth, listarDocentesAdministrador);
router.get("/", requireAuth, listarCursosAdministrador);
router.post("/", requireAuth, recibirImagenPortada, crearCursoAdministrador);

export default router;
