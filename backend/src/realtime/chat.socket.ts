import jwt from "jsonwebtoken";
import type { Server, } from "socket.io";
import pool from "../config/database";
import { obtenerAccesoCurso, verificarContacto, } from "../controllers/chat.controller";
import { construirSalaChat, } from "./chat-room";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
    throw new Error(
        "Falta configurar JWT_SECRET en el archivo .env"
    );
}

function obtenerCookie(
    cookieHeader: string | undefined,
    nombre: string
) {
    if (!cookieHeader) {
        return undefined;
    }

    const cookies =
        cookieHeader.split(";");

    for (const cookie of cookies) {
        const [clave, ...resto] =
        cookie.trim().split("=");

        if (clave === nombre) {
        return decodeURIComponent(
            resto.join("=")
        );
        }
    }

    return undefined;
}

type ChatServerToClientEvents = {
    "chat:mensaje:nuevo": (payload: {
        cursoId: number;
        ofertaCursoId: number;
        remitenteId: number;
        destinatarioId: number;

        mensaje: {
        id: number;
        tipo: string;
        contenido: string | null;
        enviadoEn: string;

        file?: {
            id: number;
            name: string;
            size: string;
            downloadUrl: string;
        };
        };
    }) => void;

    "chat:error": (payload: {
        message: string;
    }) => void;
};

type ChatClientToServerEvents = {
    "chat:unirse": (
        data: {
        cursoId: number;
        contactoId: number;
        },
        callback?: (
            response: {
                ok: boolean;
                message?: string;
            }
        ) => void
    ) => void;

    "chat:salir": (
        data: {
        cursoId: number;
        contactoId: number;
        }
    ) => void;
};

type ChatSocketData = {
    userId: number;
    rol: string;
    chatRoom?: string;
};

export function configurarChatSocket(
    io: Server<
        ChatClientToServerEvents,
        ChatServerToClientEvents,
        Record<string, never>,
        ChatSocketData
    >
) {
    
    /*
    * ======================================================
    * AUTENTICACIÓN DEL SOCKET
    * ======================================================
    *
    * El navegador envía automáticamente la cookie
    * talentia_token porque el cliente utilizará:
    *
    * withCredentials: true
    */
    io.use(async (socket, next) => {
        try {
            const cookieHeader =
            socket.handshake.headers
                .cookie;

            const token = obtenerCookie(cookieHeader, "talentia_token");

            if (!token) {
                return next(
                    new Error(
                    "No estás autenticado."
                    )
                );
            }

            const payload = jwt.verify(token, JWT_SECRET);

            if (typeof payload === "string" || !payload.userId) {
                return next(
                    new Error(
                    "Sesión no válida."
                    )
                );
            }

            const userId = Number(payload.userId);

            if (!Number.isSafeInteger(userId) || userId <= 0) {
                return next(
                    new Error(
                    "Usuario no válido."
                    )
                );
            }

            const result = await pool.query(
                `
                SELECT
                id,
                rol
                FROM usuarios
                WHERE id = $1
                AND activo = TRUE
                LIMIT 1
                `,
                [userId]
            );

            if (!result.rowCount) {
                return next(
                    new Error(
                    "Usuario no encontrado."
                    )
                );
            }

            socket.data.userId = userId;
            socket.data.rol = result.rows[0].rol;

            next();
        } catch (error) {
            console.error(
                "Error autenticando Socket.IO:",
                error
            );

            next(new Error("Sesión no válida."));
        }
    });

        /*
        * ======================================================
        * CONEXIÓN
        * ======================================================
        */
    io.on("connection", (socket) => {
        console.log(`Socket conectado: usuario ${socket.data.userId}`);

        /*
        * ==================================================
        * ENTRAR A UNA CONVERSACIÓN
        * ==================================================
        */
        socket.on("chat:unirse", async (data: {
                cursoId: number;
                contactoId: number;
            },
            callback?: (
                response: {
                    ok: boolean;
                    message?: string;
                }
            ) => void
                ) => {
                try {
                    const cursoId = Number(data?.cursoId);
                    const contactoId = Number(data?.contactoId);

                    if (!Number.isSafeInteger(cursoId) || cursoId <= 0 || !Number.isSafeInteger(contactoId) || contactoId <= 0) {
                        callback?.({
                            ok: false,
                            message:
                            "Datos de conversación no válidos.",
                        });

                        return;
                    }

                    const acceso = await obtenerAccesoCurso(socket.data.userId, cursoId);

                    if (!acceso) {
                        callback?.({
                            ok: false,
                            message:
                            "No tienes acceso a este curso.",
                        });

                        return;
                    }

                    const contactoValido = await verificarContacto(
                        acceso.oferta_curso_id,
                        socket.data.userId,
                        contactoId,
                        socket.data.rol
                    );

                    if (!contactoValido) {
                        callback?.({
                            ok: false,
                            message:
                            "No puedes conversar con este usuario.",
                        });

                        return;
                    }

                    /*
                    * Si estaba en otra conversación,
                    * abandona esa sala.
                    */
                    if (socket.data.chatRoom) {
                        socket.leave(socket.data.chatRoom);
                    }

                    const room = construirSalaChat(Number(acceso.oferta_curso_id), socket.data.userId, contactoId);
                    socket.join(room);
                    socket.data.chatRoom = room;
                    callback?.({
                        ok: true,
                    });

                    console.log(`Usuario ${socket.data.userId} entró a ${room}`);

                } catch (error) {
                    console.error(
                        "Error entrando a sala de chat:",
                        error
                    );

                    callback?.({
                        ok: false,
                        message: "No se pudo abrir la conversación.",
                    });
                }
            }
        );

        /*
        * ==================================================
        * SALIR DE UNA CONVERSACIÓN
        * ==================================================
        */
        socket.on("chat:salir", async () => {
                if (socket.data.chatRoom) {
                    socket.leave(socket.data.chatRoom);
                    socket.data.chatRoom = undefined;
                }
            }
        );

        socket.on("disconnect",(reason: string) => {
            console.log(`Socket desconectado: usuario ${socket.data.userId}. Motivo: ${reason}`);
        });
    });
}