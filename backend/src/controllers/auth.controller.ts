import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

import pool from "../config/database";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

const MAIL_USER = process.env.MAIL_USER ?? "";
const MAIL_PASSWORD = process.env.MAIL_PASSWORD ?? "";

if (!JWT_SECRET) {
  throw new Error(
    "Falta configurar JWT_SECRET en el archivo .env"
  );
}

if (!MAIL_USER || !MAIL_PASSWORD) {
  throw new Error(
    "Falta configurar MAIL_USER o MAIL_PASSWORD en el archivo .env"
  );
}

/* ==========================================
   CONFIGURACIÓN DE CORREO
========================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD,
  },
});





/* ==========================================
   ENVIAR INVITACIÓN DE REGISTRO
========================================== */

export async function sendRegistrationInvitation(
  req: Request,
  res: Response
) {
  try {
    const {
     correo,
     nombre,
     dni,
     telefono,
     tipoAlumno,
     empresaAliada,
   } = req.body;

    if (!correo?.trim()) {
      return res.status(400).json({
        message: "El correo es obligatorio.",
      });
    }

    const email = correo.trim().toLowerCase();

    // Si ya existe como usuario, no enviamos otra invitación
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(correo) = LOWER($1)
      `,
      [email]
    );

    if (existingUser.rowCount) {
      return res.status(409).json({
        message: "Este correo ya pertenece a un usuario registrado.",
      });
    }

    // Invalidar invitaciones anteriores del mismo correo
    await pool.query(
      `
      UPDATE registration_invitations
      SET used = TRUE
      WHERE LOWER(email) = LOWER($1)
        AND used = FALSE
      `,
      [email]
    );

    // Token seguro
    const token = crypto.randomBytes(32).toString("hex");

    // Guardamos solo el hash, nunca el token real
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await pool.query(
  `
  INSERT INTO registration_invitations (
    email,
    token_hash,
    expires_at,
    nombre,
    dni,
    telefono,
    tipo_alumno,
    empresa_aliada
  )
  VALUES (
    $1,
    $2,
    NOW() + INTERVAL '24 hours',
    $3,
    $4,
    $5,
    $6,
    $7
  )
  `,
  [
    email,
    tokenHash,
    nombre || null,
    dni || null,
    telefono || null,
    tipoAlumno || null,
    empresaAliada || null,
  ]
);

    const frontendUrl =
      process.env.FRONTEND_URL ?? "http://localhost:3000";

    const registrationUrl =
      `${frontendUrl}/registro?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: `"Talentia" <${MAIL_USER}>`,
      to: email,
      subject: "Invitación para registrarte en Talentia",

      text:
        `Hola ${nombre || "postulante"}. ` +
        `Has sido invitado a completar tu registro en Talentia. ` +
        `Ingresa al siguiente enlace: ${registrationUrl}. ` +
        `El enlace vence en 24 horas.`,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #0F2851;">
            Completa tu registro en Talentia
          </h2>

          <p>
            Hola ${nombre || "postulante"},
          </p>

          <p>
            Has sido invitado a completar tu registro
            en la plataforma educativa Talentia.
          </p>

          <p>
            Este enlace está asociado únicamente al correo:
          </p>

          <p>
            <strong>${email}</strong>
          </p>

          <a
            href="${registrationUrl}"
            style="
              display: inline-block;
              padding: 12px 22px;
              background: #2D97E8;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Completar registro
          </a>

          <p style="margin-top: 20px;">
            Este enlace vence en 24 horas y solo puede
            utilizarse una vez.
          </p>

          <p>
            Si no solicitaste este acceso, puedes ignorar
            este mensaje.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Invitación enviada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error enviando invitación de registro:",
      error
    );

    return res.status(500).json({
      message: "No se pudo enviar la invitación.",
    });
  }
}

/* ==========================================
   VALIDAR INVITACIÓN DE REGISTRO
========================================== */

export async function verifyRegistrationInvitation(
  req: Request,
  res: Response
) {
  try {
    const token =
      typeof req.query.token === "string"
        ? req.query.token
        : "";

    if (!token) {
      return res.status(400).json({
        valid: false,
        message: "Token de invitación requerido.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const result = await pool.query(
  `
  SELECT
    id,
    email,
    nombre,
    dni,
    telefono,
    tipo_alumno,
    empresa_aliada,
    expires_at,
    used
  FROM registration_invitations
  WHERE token_hash = $1
    AND used = FALSE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1
  `,
  [tokenHash]
);

    if (!result.rowCount) {
      return res.status(400).json({
        valid: false,
        message:
          "La invitación es inválida, expiró o ya fue utilizada.",
      });
    }

    const invitation = result.rows[0];

   return res.status(200).json({
  valid: true,
  correo: invitation.email,
  nombre: invitation.nombre,
  dni: invitation.dni,
  telefono: invitation.telefono,
  tipoAlumno: invitation.tipo_alumno,
  empresaAliada: invitation.empresa_aliada,
});
  } catch (error) {
    console.error(
      "Error verificando invitación:",
      error
    );

    return res.status(500).json({
      valid: false,
      message: "Error interno del servidor.",
    });
  }
}

/* ==========================================
   REGISTRO
========================================== */

export async function register(
  req: Request,
  res: Response
) {
  try {
    const {
      nombres,
      dni,
      empresaAliada,
      usuario,
      genero,
      telefono,
      fechaNacimiento,
      direccion,
      correo,
      password,
      token,
    } = req.body;

    if (
      !nombres ||
      !usuario ||
      !correo ||
      !password
    ) {
      return res.status(400).json({
        message: "Completa todos los campos.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "La contraseña debe tener mínimo 8 caracteres.",
      });
    }

    if (typeof dni !== "string" || !/^\d{8}$/.test(dni.trim())) {
      return res.status(400).json({ message: "El DNI debe tener 8 dígitos." });
    }

    if (
      empresaAliada != null &&
      (typeof empresaAliada !== "string" || empresaAliada.trim().length > 150)
    ) {
      return res.status(400).json({ message: "La empresa aliada no es válida." });
    }

    if (genero !== "M" && genero !== "F") {
      return res.status(400).json({ message: "Selecciona un género válido." });
    }

    if (
      typeof telefono !== "string" ||
      !telefono.trim() ||
      telefono.trim().length > 20
    ) {
      return res.status(400).json({ message: "El teléfono no es válido." });
    }

    if (typeof direccion !== "string" || !direccion.trim()) {
      return res.status(400).json({ message: "Ingresa una dirección." });
    }

    const fecha = typeof fechaNacimiento === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
        ? new Date(`${fechaNacimiento}T00:00:00.000Z`)
        : new Date(NaN);

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== fechaNacimiento
    ) {
      return res.status(400).json({ message: "La fecha de nacimiento no es válida." });
    }

    if (!token) {
  return res.status(403).json({
    message:
      "Necesitas una invitación válida para registrarte.",
  });
}

const tokenHash = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

const invitationResult = await pool.query(
  `
  SELECT
    id,
    email
  FROM registration_invitations
  WHERE token_hash = $1
    AND used = FALSE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1
  `,
  [tokenHash]
);

if (!invitationResult.rowCount) {
  return res.status(403).json({
    message:
      "La invitación es inválida, expiró o ya fue utilizada.",
  });
}

const invitation = invitationResult.rows[0];

if (
  invitation.email.toLowerCase() !==
  correo.trim().toLowerCase()
) {
  return res.status(403).json({
    message:
      "El correo no corresponde a la invitación recibida.",
  });
}

    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE LOWER(usuario) = LOWER($1)
          OR LOWER(correo) = LOWER($2)
          OR dni = $3`,
      [
        usuario.trim(),
        correo.trim().toLowerCase(),
        dni.trim(),
      ]
    );

    if (existingUser.rowCount) {
      return res.status(409).json({
        message:
          "El usuario, correo o DNI ya está registrado.",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const result = await pool.query(
  `
  INSERT INTO users (
    nombres,
    dni,
    empresa_aliada,
    usuario,
    genero,
    telefono,
    fecha_nacimiento,
    direccion,
    correo,
    password_hash,
    rol
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    'Estudiante'
  )
  RETURNING
    id,
    nombres,
    dni,
    usuario,
    correo,
    rol,
    id_persona
  `,
  [
    nombres.trim(),
    dni.trim(),
    empresaAliada?.trim() || null,
    usuario.trim(),
    genero,
    telefono.trim(),
    fechaNacimiento,
    direccion.trim(),
    correo.trim().toLowerCase(),
    passwordHash,
  ]
);

await pool.query(
  `
  UPDATE registration_invitations
  SET
    used = TRUE,
    estado = 'Matriculado'
  WHERE id = $1
  `,
  [invitation.id]
);



    return res.status(201).json({
      message:
        "Usuario registrado correctamente.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error en registro:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno del servidor.",
    });
  }
}

/* ==========================================
   LOGIN
========================================== */

export async function login(
  req: Request,
  res: Response
) {
  try {
    const {
      usuario,
      password,
    } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        message:
          "Ingresa tu usuario y contraseña.",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        nombres,
        usuario,
        correo,
        password_hash,
        rol,
        id_persona
       FROM users
       WHERE LOWER(usuario) = LOWER($1)`,
      [usuario.trim()]
    );

    if (!result.rowCount) {
      return res.status(401).json({
        message:
          "Usuario o contraseña incorrectos.",
      });
    }

    const user = result.rows[0];

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordValid) {
      return res.status(401).json({
        message:
          "Usuario o contraseña incorrectos.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie(
      "talentia_token",
      token,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        maxAge:
          24 * 60 * 60 * 1000,
      }
    );

    return res.status(200).json({
      message:
        "Inicio de sesión correcto.",

      user: {
        id: user.id,
        nombres: user.nombres,
        usuario: user.usuario,
        correo: user.correo,
        rol: user.rol,
        id_persona:
          user.id_persona,
      },
    });
  } catch (error) {
    console.error(
      "Error en login:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno del servidor.",
    });
  }
}

/* ==========================================
   SOLICITAR RESTABLECIMIENTO
========================================== */

export async function forgotPassword(
  req: Request,
  res: Response
) {
  try {
    const { correo } = req.body;

    if (!correo?.trim()) {
      return res.status(400).json({
        message:
          "Ingresa tu correo electrónico.",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        nombres,
        correo
       FROM users
       WHERE LOWER(correo) = LOWER($1)`,
      [correo.trim()]
    );

    /*
     * No revelamos si el correo existe.
     */
    if (!result.rowCount) {
      return res.status(200).json({
        message:
          "Si el correo está registrado, recibirás un código de recuperación.",
      });
    }

    const user = result.rows[0];

    /*
     * Generar código de 6 dígitos.
     */
    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    /*
     * Guardamos el código cifrado.
     */
    const codeHash =
      await bcrypt.hash(
        codigo,
        10
      );

    /*
     * Invalidar códigos anteriores.
     */
    await pool.query(
      `UPDATE password_reset_codes
       SET used = TRUE
       WHERE user_id = $1
       AND used = FALSE`,
      [user.id]
    );

    /*
     * Crear nuevo código.
     * Expira en 10 minutos.
     */
    await pool.query(
      `INSERT INTO password_reset_codes
        (
          user_id,
          code_hash,
          expires_at
        )
       VALUES
        (
          $1,
          $2,
          NOW() + INTERVAL '10 minutes'
        )`,
      [
        user.id,
        codeHash,
      ]
    );

    /*
     * Mandar correo.
     */
    await transporter.sendMail({
      from: `"Talentia" <${MAIL_USER}>`,
      to: user.correo,
      subject:
        "Código para restablecer tu contraseña",

      text:
        `Hola ${user.nombres}. ` +
        `Tu código de recuperación es ${codigo}. ` +
        `Este código vence en 10 minutos.`,

      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Restablecer contraseña</h2>

          <p>
            Hola ${user.nombres},
          </p>

          <p>
            Tu código de recuperación es:
          </p>

          <h1 style="letter-spacing: 8px;">
            ${codigo}
          </h1>

          <p>
            Este código vence en 10 minutos.
          </p>

          <p>
            Si no solicitaste este cambio,
            puedes ignorar este mensaje.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "Si el correo está registrado, recibirás un código de recuperación.",
    });
  } catch (error) {
    console.error(
      "Error al solicitar recuperación:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo procesar la solicitud.",
    });
  }
}

/* ==========================================
   VERIFICAR CÓDIGO
========================================== */

export async function verifyResetCode(
  req: Request,
  res: Response
) {
  try {
    const {
      correo,
      codigo,
    } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({
        message:
          "Correo y código son obligatorios.",
      });
    }

    if (!/^\d{6}$/.test(codigo)) {
      return res.status(400).json({
        message:
          "El código debe tener 6 dígitos.",
      });
    }

    const userResult =
      await pool.query(
        `SELECT id
         FROM users
         WHERE LOWER(correo) = LOWER($1)`,
        [correo.trim()]
      );

    if (!userResult.rowCount) {
      return res.status(400).json({
        message:
          "Código inválido o expirado.",
      });
    }

    const user =
      userResult.rows[0];

    const resetResult =
      await pool.query(
        `SELECT
          id,
          code_hash,
          expires_at
         FROM password_reset_codes
         WHERE user_id = $1
         AND used = FALSE
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

    if (!resetResult.rowCount) {
      return res.status(400).json({
        message:
          "Código inválido o expirado.",
      });
    }

    const reset =
      resetResult.rows[0];

    const codigoValido =
      await bcrypt.compare(
        codigo,
        reset.code_hash
      );

    if (!codigoValido) {
      return res.status(400).json({
        message:
          "Código inválido o expirado.",
      });
    }

    return res.status(200).json({
      message:
        "Código verificado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error verificando código:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno del servidor.",
    });
  }
}

/* ==========================================
   CAMBIAR CONTRASEÑA
========================================== */

export async function resetPassword(
  req: Request,
  res: Response
) {
  try {
    const {
      correo,
      codigo,
      password,
    } = req.body;

    if (
      !correo ||
      !codigo ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Completa todos los campos.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "La contraseña debe tener mínimo 8 caracteres.",
      });
    }

    const userResult =
      await pool.query(
        `SELECT id
         FROM users
         WHERE LOWER(correo) = LOWER($1)`,
        [correo.trim()]
      );

    if (!userResult.rowCount) {
      return res.status(400).json({
        message:
          "Solicitud de recuperación inválida.",
      });
    }

    const user =
      userResult.rows[0];

    const resetResult =
      await pool.query(
        `SELECT
          id,
          code_hash
         FROM password_reset_codes
         WHERE user_id = $1
         AND used = FALSE
         AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

    if (!resetResult.rowCount) {
      return res.status(400).json({
        message:
          "Código inválido o expirado.",
      });
    }

    const reset =
      resetResult.rows[0];

    const codigoValido =
      await bcrypt.compare(
        codigo,
        reset.code_hash
      );

    if (!codigoValido) {
      return res.status(400).json({
        message:
          "Código inválido o expirado.",
      });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE users
         SET
           password_hash = $1,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [
          passwordHash,
          user.id,
        ]
      );

      await client.query(
        `UPDATE password_reset_codes
         SET used = TRUE
         WHERE id = $1`,
        [reset.id]
      );

      await client.query(
        "COMMIT"
      );

    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;

    } finally {
      client.release();
    }

    return res.status(200).json({
      message:
        "Contraseña actualizada correctamente.",
    });

  } catch (error) {
    console.error(
      "Error restableciendo contraseña:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno del servidor.",
    });
  }
}

export async function getRegistrationStatuses(
  req: Request,
  res: Response
) {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT ON (LOWER(email))
        email,
        estado
      FROM registration_invitations
      ORDER BY LOWER(email), created_at DESC
      `
    );

    return res.status(200).json({
      statuses: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo estados de registro:",
      error
    );

    return res.status(500).json({
      message: "No se pudieron obtener los estados.",
    });
  }
}

/* ==========================================
   LOGOUT
========================================== */

export function logout(
  _req: Request,
  res: Response
) {
  res.clearCookie(
    "talentia_token"
  );

  return res.status(200).json({
    message: "Sesión cerrada.",
  });
}
