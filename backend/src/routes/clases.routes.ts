import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware";

import {
  obtenerClasesAlumno,
  obtenerClasesDocente,
  crearClase,
  editarClase,
  cancelarClase,
  iniciarClase,
  unirseClase,
  obtenerGrabaciones,
} from "../controllers/clases.controller";

const router = Router();

/*
 * ALUMNO
 */

/**
 * GET /api/clases/alumno/:cursoId
 */
router.get(
  "/alumno/:cursoId",
  requireAuth,
  obtenerClasesAlumno
);

/**
 * GET /api/clases/alumno/:cursoId/:claseId/unirse
 */
router.get(
  "/alumno/:cursoId/:claseId/unirse",
  requireAuth,
  unirseClase
);

/**
 * GET /api/clases/alumno/:cursoId/:claseId/grabaciones
 */
router.get(
  "/alumno/:cursoId/:claseId/grabaciones",
  requireAuth,
  obtenerGrabaciones
);


/*
 * DOCENTE
 */

/**
 * GET /api/clases/docente/:cursoId
 */
router.get(
  "/docente/:cursoId",
  requireAuth,
  obtenerClasesDocente
);

/**
 * POST /api/clases/docente/:cursoId
 */
router.post(
  "/docente/:cursoId",
  requireAuth,
  crearClase
);

/**
 * PATCH /api/clases/docente/:cursoId/:claseId
 */
router.patch(
  "/docente/:cursoId/:claseId",
  requireAuth,
  editarClase
);

/**
 * DELETE /api/clases/docente/:cursoId/:claseId
 */
router.delete(
  "/docente/:cursoId/:claseId",
  requireAuth,
  cancelarClase
);

/**
 * POST /api/clases/docente/:cursoId/:claseId/iniciar
 */
router.post(
  "/docente/:cursoId/:claseId/iniciar",
  requireAuth,
  iniciarClase
);

/**
 * GET /api/clases/docente/:cursoId/:claseId/grabaciones
 */
router.get(
  "/docente/:cursoId/:claseId/grabaciones",
  requireAuth,
  obtenerGrabaciones
);

export default router;