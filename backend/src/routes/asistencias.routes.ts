import {
  Router,
} from "express";

import {
  requireAuth,
} from "../middleware/auth.middleware";
import { obtenerAsistenciaAlumno } from "../controllers/asistencias-alumno.controller";

import {
  guardarAsistenciaDocente,
  obtenerAsistenciaDocente,
} from "../controllers/asistencias.controller";


const router =
  Router();

router.get("/alumno/:cursoId", requireAuth, obtenerAsistenciaAlumno);


router.get(
  "/docente/:cursoId",
  requireAuth,
  obtenerAsistenciaDocente
);


router.put(
  "/docente/:cursoId",
  requireAuth,
  guardarAsistenciaDocente
);


export default router;
