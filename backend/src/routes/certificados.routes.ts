import {
  Router,
} from "express";

import {
  descargarCertificadoEstudiante,
  listarCertificadosEstudiante,
  obtenerCertificadoEstudiante,
} from "../controllers/certificados.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

const router =
  Router();

router.get(
  "/",
  requireAuth,
  listarCertificadosEstudiante
);

router.get(
  "/:certificadoId/pdf",
  requireAuth,
  descargarCertificadoEstudiante
);

router.get(
  "/:certificadoId",
  requireAuth,
  obtenerCertificadoEstudiante
);

export default router;