import { Router } from "express";

import {
  register,
  login,
  logout,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  sendRegistrationInvitation,
  verifyRegistrationInvitation,
  getRegistrationStatuses,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

router.post(
  "/send-registration-invitation",
  sendRegistrationInvitation
);

router.get(
  "/registration-invitation",
  verifyRegistrationInvitation
);

router.get(
  "/registration-statuses",
  getRegistrationStatuses
);

export default router;