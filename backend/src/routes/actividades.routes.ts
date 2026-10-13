import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { actualizarActividad, crearActividad, obtenerConfiguracionActividad } from "../controllers/actividades-gestion.controller";
import {
  obtenerMiEntrega,
  enviarEntrega,
  listarEntregasDocente,
  obtenerEntregaAlumnoDocente,
  calificarEntrega,
  descargarArchivoEntrega,
  descargarRubrica,
} from "../controllers/actividades-entregas.controller";

const router = Router();

router.get(
  "/docente/:cursoId/:contenidoId/configuracion",
  requireAuth,
  obtenerConfiguracionActividad
);

router.put(
  "/docente/:cursoId/:contenidoId/configuracion",
  requireAuth,
  actualizarActividad
);

router.post(
  "/docente/:cursoId/modulos/:moduloId",
  requireAuth,
  crearActividad
);

router.get("/archivo/:archivoId", requireAuth, descargarArchivoEntrega);
router.get("/:cursoId/:contenidoId/rubrica", requireAuth, descargarRubrica);
router.get("/:cursoId/:contenidoId/mi-entrega", requireAuth, obtenerMiEntrega);
router.post("/:cursoId/:contenidoId/entregar", requireAuth, enviarEntrega);
router.get("/docente/:cursoId/:contenidoId", requireAuth, listarEntregasDocente);
router.get("/docente/:cursoId/:contenidoId/alumno/:alumnoId", requireAuth, obtenerEntregaAlumnoDocente);
router.put("/docente/:cursoId/:contenidoId/entregas/:entregaId/calificacion", requireAuth, calificarEntrega);

export default router;
