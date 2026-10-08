/**Migra los contenidos existentes a Cloudflare R2*/
import "dotenv/config";

import { stat } from "node:fs/promises";
import path from "node:path";

import pool from "../src/config/database";
import {
  copyObjectInR2,
  createCourseContentKey,
  deleteObjectFromR2,
  isR2Path,
  stripR2Prefix,
  toR2Path,
  uploadFileToR2,
} from "../src/services/r2.service";

const APPLY = process.argv.includes("--aplicar");
const MATERIALES_DIR = path.resolve(__dirname, "../materiales");
const UUID_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;

const MIME_BY_EXTENSION: Record<string, string> = {
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

type ContentRow = {
  id: number;
  tipo: string;
  titulo: string;
  ruta_archivo: string;
  nombre_archivo: string | null;
  modulo_id: number;
  curso_id: number;
};

async function loadRows() {
  const result = await pool.query<ContentRow>(
    `
      SELECT
        cc.id,
        cc.tipo,
        cc.titulo,
        cc.ruta_archivo,
        cc.nombre_archivo,
        mc.id AS modulo_id,
        mc.curso_id
      FROM contenidos_curso cc
      JOIN modulos_curso mc
        ON mc.id = cc.modulo_id
      WHERE cc.tipo IN ('pdf', 'pptx', 'docx', 'video')
        AND cc.ruta_archivo IS NOT NULL
        AND BTRIM(cc.ruta_archivo) <> ''
      ORDER BY cc.id
    `
  );

  return result.rows;
}

async function migrateLocalFile(row: ContentRow) {
  const relativePath = row.ruta_archivo.trim();
  const absolutePath = path.resolve(MATERIALES_DIR, relativePath);
  const relativeToRoot = path.relative(MATERIALES_DIR, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    console.log(`  [#${row.id}] OMITIDO: ruta fuera de materiales (${relativePath})`);
    return false;
  }

  let size: number;

  try {
    size = (await stat(absolutePath)).size;
  } catch {
    console.log(`  [#${row.id}] NO ENCONTRADO en disco: ${relativePath}`);
    return false;
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const mime = MIME_BY_EXTENSION[extension];

  if (!mime) {
    console.log(`  [#${row.id}] OMITIDO: extensión no soportada (${extension})`);
    return false;
  }

  const originalName =
    row.nombre_archivo?.trim() || path.basename(absolutePath);

  const key = createCourseContentKey({
    courseId: row.curso_id,
    moduleId: row.modulo_id,
    originalName,
  });

  console.log(`  [#${row.id}] ${relativePath}  ->  r2://${key}`);

  if (!APPLY) {
    return true;
  }

  await uploadFileToR2({
    filePath: absolutePath,
    key,
    contentType: mime,
    contentLength: size,
    originalName,
  });

  try {
    await pool.query(
      `
        UPDATE contenidos_curso
        SET ruta_archivo = $1,
            nombre_archivo = COALESCE(nombre_archivo, $2),
            mime_type = COALESCE(mime_type, $3),
            tamano_bytes = COALESCE(tamano_bytes, $4),
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
      [toR2Path(key), originalName, mime, size, row.id]
    );
  } catch (error) {
    await deleteObjectFromR2(key).catch(() => undefined);
    throw error;
  }

  return true;
}

async function renameUuidObject(row: ContentRow) {
  const oldKey = stripR2Prefix(row.ruta_archivo.trim());

  if (!UUID_NAME.test(path.posix.basename(oldKey)) || !row.nombre_archivo?.trim()) {
    return false;
  }

  const newKey = createCourseContentKey({
    courseId: row.curso_id,
    moduleId: row.modulo_id,
    originalName: row.nombre_archivo.trim(),
  });

  console.log(`  [#${row.id}] r2://${oldKey}  ->  r2://${newKey}`);

  if (!APPLY) {
    return true;
  }

  await copyObjectInR2(oldKey, newKey);

  try {
    await pool.query(
      `
        UPDATE contenidos_curso
        SET ruta_archivo = $1,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [toR2Path(newKey), row.id]
    );
  } catch (error) {
    await deleteObjectFromR2(newKey).catch(() => undefined);
    throw error;
  }

  await deleteObjectFromR2(oldKey).catch((error) => {
    console.warn(`  [#${row.id}] No se pudo borrar la clave antigua:`, error);
  });

  return true;
}

async function main() {
  console.log(
    APPLY
      ? "MODO APLICAR: se realizarán cambios en R2 y en PostgreSQL.\n"
      : "MODO SIMULACRO: no se cambia nada. Usa --aplicar para ejecutar.\n"
  );

  const rows = await loadRows();
  const localRows = rows.filter((row) => !isR2Path(row.ruta_archivo.trim()));
  const r2Rows = rows.filter((row) => isR2Path(row.ruta_archivo.trim()));

  let migrated = 0;
  let renamed = 0;
  let failed = 0;

  console.log(`1) Archivos locales por subir a R2: ${localRows.length}`);

  for (const row of localRows) {
    try {
      if (await migrateLocalFile(row)) migrated++;
      else failed++;
    } catch (error) {
      failed++;
      console.error(`  [#${row.id}] ERROR:`, error);
    }
  }

  console.log(`\n2) Archivos en R2 con nombre de código por renombrar`);

  for (const row of r2Rows) {
    try {
      if (await renameUuidObject(row)) renamed++;
    } catch (error) {
      failed++;
      console.error(`  [#${row.id}] ERROR:`, error);
    }
  }

  console.log(
    `\nResumen: ${migrated} subidos, ${renamed} renombrados, ${failed} con problemas.`
  );

  if (!APPLY) {
    console.log("Era un simulacro. Ejecuta con --aplicar para aplicar los cambios.");
  }
}

main()
  .catch((error) => {
    console.error("Error en la migración:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
