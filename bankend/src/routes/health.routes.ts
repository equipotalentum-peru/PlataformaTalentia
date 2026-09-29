import { Router } from "express";
import pool from "../config/database";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");

    return res.status(200).json({
      ok: true,
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Error de conexión con PostgreSQL:", error);

    return res.status(500).json({
      ok: false,
      database: "disconnected",
    });
  }
});

export default router;