import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  obtenerOfertasDocente,
  crearForo,
  obtenerForosDocente,
  obtenerContextoForos,
  obtenerForos,
  obtenerDetalleForo,
  responderForo,
  editarForo,
  eliminarForo,
} from "../controllers/foros.controller";

const router = Router();

router.get(
  "/ofertas-docente",
  requireAuth,
  obtenerOfertasDocente
);

router.post("/", requireAuth, crearForo);

router.get(
  "/ofertas/:ofertaId/docente",
  requireAuth,
  obtenerForosDocente
);

router.get("/cursos/:cursoId", requireAuth, obtenerContextoForos);
router.get("/ofertas/:ofertaId", requireAuth, obtenerForos);
router.get("/:foroId", requireAuth, obtenerDetalleForo);
router.post("/:foroId/respuestas", requireAuth, responderForo);
router.put("/:foroId", requireAuth, editarForo);
router.delete("/:foroId", requireAuth, eliminarForo);

export default router;
