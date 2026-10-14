import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listarUsuarios } from "../controllers/usuarios.controller";

const router = Router();

router.get("/", requireAuth, listarUsuarios);

export default router;
