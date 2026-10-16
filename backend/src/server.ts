import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { Server as SocketIOServer, } from "socket.io";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import cursosRoutes from "./routes/cursos.routes";
import clasesRoutes from "./routes/clases.routes";
import anunciosRoutes from "./routes/anuncios.routes";
import calificacionesRoutes from "./routes/calificaciones.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import forosRoutes from "./routes/foros.routes";
import chatRoutes from "./routes/chat.routes";
import certificadosRoutes from "./routes/certificados.routes";
import reportesRoutes from "./routes/reportes.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import actividadesRoutes from "./routes/actividades.routes";
import asistenciasRoutes from "./routes/asistencias.routes";
import cursosAdminRoutes from "./routes/cursos-admin.routes";
import { sincronizarEstadosClases, } from "./services/clases-estado.service";
import { configurarChatSocket,} from "./realtime/chat.socket";
import matriculasAdminRoutes from "./routes/matriculas-admin.routes";

const app = express();

const httpServer = createServer(app);

const io =
  new SocketIOServer(
    httpServer,
    {
      cors: {
        origin:
          "http://localhost:3000",

        credentials: true,
      },
    }
  );

app.set("io", io);

configurarChatSocket(io);

const PORT = Number(
  process.env.PORT ?? 4000
);

app.use(
  cors({
    origin:
      "http://localhost:3000",
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);



app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", anunciosRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use("/api/foros", forosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/certificados", certificadosRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/asistencias", asistenciasRoutes);
app.use("/api/administrador/cursos", cursosAdminRoutes);
app.use("/api/administrador/matriculas", matriculasAdminRoutes);

void sincronizarEstadosClases();

setInterval(() => {
  void sincronizarEstadosClases();
}, 30_000);

httpServer.listen(
  PORT,
  () => {
    console.log(
      `Backend ejecutándose en http://localhost:${PORT}`
    );
  }
);
