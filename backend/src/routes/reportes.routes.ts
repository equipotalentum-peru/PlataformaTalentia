import { Router } from "express";
import {
  exportarReporte,
  obtenerHistorialReportes,
  obtenerReporte,
} from "../controllers/reportes.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", obtenerReporte);
router.get("/exportar", exportarReporte);
router.get("/historial", obtenerHistorialReportes);

export default router;
