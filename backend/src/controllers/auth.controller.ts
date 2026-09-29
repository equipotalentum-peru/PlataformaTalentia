import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import pool from "../config/database";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error(
    "Falta configurar JWT_SECRET en el archivo .env"
  );
}

export async function register(
  req: Request,
  res: Response
) {
  try {
    const {
      nombres,
      apellidos,
      usuario,
      password,
    } = req.body;

    if (!nombres || !apellidos || !usuario || !password) {
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

    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE LOWER(usuario) = LOWER($1)`,
      [usuario.trim()]
    );

    if (existingUser.rowCount) {
      return res.status(409).json({
        message: "El usuario ya está registrado.",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const result = await pool.query(
      `INSERT INTO users
        (nombres, apellidos, usuario, password_hash, rol)
       VALUES
        ($1, $2, $3, $4, 'Estudiante')
       RETURNING
        id,
        nombres,
        apellidos,
        usuario,
        correo,
        rol,
        id_persona`,
      [
        nombres.trim(),
        apellidos.trim(),
        usuario.trim(),
        passwordHash,
      ]
    );

    return res.status(201).json({
      message: "Usuario registrado correctamente.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error en registro:",
      error
    );

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
}

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
        apellidos,
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

    res.cookie("talentia_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Inicio de sesión correcto.",
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        usuario: user.usuario,
        correo: user.correo,
        rol: user.rol,
        id_persona: user.id_persona,
      },
    });
  } catch (error) {
    console.error(
      "Error en login:",
      error
    );

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
}

export function logout(
  _req: Request,
  res: Response
) {
  res.clearCookie("talentia_token");

  return res.status(200).json({
    message: "Sesión cerrada.",
  });
}