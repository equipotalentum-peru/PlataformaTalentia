import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listarUsuarios, obtenerUsuario, modificarUsuario, requireAdmin } from "../controllers/usuarios.controller";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", listarUsuarios);
router.get("/:id", obtenerUsuario);
router.put("/:id", modificarUsuario);
router.patch("/:id/estado", modificarUsuario);
router.delete("/:id", modificarUsuario);

export default router;
