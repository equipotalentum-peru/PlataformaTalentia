
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../controllers/usuarios.controller";

import {
  actualizarPeriodo,
  cambiarEstadoPeriodo,
  crearPeriodo,
  listarPeriodos,
} from "../controllers/periodos-admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listarPeriodos);
router.post("/", crearPeriodo);
router.patch("/:id/estado", cambiarEstadoPeriodo);
router.patch("/:id", actualizarPeriodo);

export default router;
