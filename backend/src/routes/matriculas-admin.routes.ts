import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../controllers/usuarios.controller";
import {
  cambiarEstadoMatricula,
  listarMatriculas,
  obtenerOpcionesMatricula,
  registrarMatricula,
} from "../controllers/matriculas-admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/opciones", obtenerOpcionesMatricula);
router.get("/", listarMatriculas);
router.post("/", registrarMatricula);
router.patch("/:id/estado", cambiarEstadoMatricula);

export default router;