import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import cursosRoutes from "./routes/cursos.routes";

const app = express();

const PORT = Number(
  process.env.PORT ?? 4000
);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cursos", cursosRoutes);

app.listen(PORT, () => {
  console.log(
    `Backend ejecutándose en http://localhost:${PORT}`
  );
});
