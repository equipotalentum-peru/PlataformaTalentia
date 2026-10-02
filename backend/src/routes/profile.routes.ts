import { Router } from "express";

import { getProfile, updateProfile } from "../controllers/profile.controller";
import { deleteProfilePhoto, getProfilePhoto, uploadProfilePhoto } from "../controllers/profile-photo.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { recibirFotoPerfil } from "../middleware/profile-photo.middleware";

const router = Router();

router.get("/", requireAuth, getProfile);
router.patch("/", requireAuth, updateProfile);
router.get("/photo", requireAuth, getProfilePhoto);
router.post("/photo", requireAuth, recibirFotoPerfil, uploadProfilePhoto);
router.delete("/photo", requireAuth, deleteProfilePhoto);

export default router;
