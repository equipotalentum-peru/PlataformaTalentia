import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  obtenerMiEntrega,
  enviarEntrega,
  listarEntregasDocente,
  obtenerEntregaAlumnoDocente,
  calificarEntrega,
  descargarArchivoEntrega,
} from "../controllers/actividades-entregas.controller";

const router = Router();

router.get("/archivo/:archivoId", requireAuth, descargarArchivoEntrega);
router.get("/:cursoId/:contenidoId/mi-entrega", requireAuth, obtenerMiEntrega);
router.post("/:cursoId/:contenidoId/entregar", requireAuth, enviarEntrega);
router.get("/docente/:cursoId/:contenidoId", requireAuth, listarEntregasDocente);
router.get("/docente/:cursoId/:contenidoId/alumno/:alumnoId", requireAuth, obtenerEntregaAlumnoDocente);
router.put("/docente/:cursoId/:contenidoId/entregas/:entregaId/calificacion", requireAuth, calificarEntrega);

export default router;
