import "dotenv/config";

import bcrypt from "bcrypt";
import pool from "../src/config/database";

async function createAdmin() {
  try {
    const nombres = "Administrador";
    const usuario = "admin";
    const password = "Admin1234";

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(usuario) = LOWER($1)
      `,
      [usuario]
    );

    if (existingUser.rowCount) {
      console.log(
        "El usuario administrador ya existe."
      );

      return;
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const result = await pool.query(
      `
      INSERT INTO users
      (
        nombres,
        usuario,
        password_hash,
        rol
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        'Administrador'
      )
      RETURNING
        id,
        nombres,
        usuario,
        rol
      `,
      [
        nombres,
        usuario,
        passwordHash,
      ]
    );

    console.log(
      "Administrador creado correctamente:"
    );

    console.log(result.rows[0]);
  } catch (error) {
    console.error(
      "Error al crear administrador:",
      error
    );
  } finally {
    await pool.end();
  }
}

createAdmin();