import "dotenv/config";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const R2_PATH_PREFIX = "r2://";

const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
const bucketName = process.env.R2_BUCKET_NAME?.trim() ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";

const endpoint =
  process.env.R2_ENDPOINT?.trim() ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

let cachedClient: S3Client | undefined;

function getClient() {
  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Cloudflare R2 no está configurado. Revisa R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_ENDPOINT."
    );
  }

  cachedClient ??= new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return cachedClient;
}

function getBucketName() {
  if (!bucketName) {
    throw new Error("Falta configurar R2_BUCKET_NAME en el archivo .env");
  }

  return bucketName;
}

export function isR2Path(value: string) {
  return value.startsWith(R2_PATH_PREFIX);
}

export function stripR2Prefix(value: string) {
  return value.slice(R2_PATH_PREFIX.length);
}

export function toR2Path(key: string) {
  return `${R2_PATH_PREFIX}${key}`;
}

/**
 * Convierte un nombre de archivo en algo seguro para usar como parte de una
 * clave de R2: sin tildes, sin espacios ni caracteres especiales, pero
 * manteniendo el nombre legible.
 *   "Factura, boleta y notas (v2).pptx" -> "Factura-boleta-y-notas-v2"
 */
export function slugifyFileName(fileName: string) {
  const extension = path.extname(fileName);
  const base = path.basename(fileName, extension);

  return (
    base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-._]+|[-._]+$/g, "")
      .slice(0, 100)
      .replace(/[-._]+$/g, "") || "archivo"
  );
}

/**
 * Clave legible: courses/12/modules/3/contents/factura-boleta-y-notas-3f9a1c2e.pptx
 * El sufijo corto evita que dos archivos con el mismo nombre se sobrescriban.
 */
export function createCourseContentKey({
  courseId,
  moduleId,
  originalName,
}: {
  courseId: number;
  moduleId: number;
  originalName: string;
}) {
  const extension = path.extname(originalName).toLowerCase();
  const readableName = slugifyFileName(originalName);
  const uniqueSuffix = randomUUID().slice(0, 8);

  return `courses/${courseId}/modules/${moduleId}/contents/${readableName}-${uniqueSuffix}${extension}`;
}

export function createChatFileKey({
  courseId,
  conversationId,
  originalName,
}: {
  courseId: number;
  conversationId: number;
  originalName: string;
}) {
  const extension = path.extname(originalName).toLowerCase();

  const baseName = path.basename(originalName, path.extname(originalName));

  const safeBaseName = slugifyFileName(baseName);

  return `chat/courses/${courseId}/conversations/${conversationId}/${safeBaseName}${extension}`;
}

/** Sube un archivo del disco (se usa solo en el script de migración). */
export async function uploadFileToR2({
  filePath,
  key,
  contentType,
  contentLength,
  originalName,
}: {
  filePath: string;
  key: string;
  contentType: string;
  contentLength?: number;
  originalName?: string;
}) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
      ContentLength: contentLength,
      Metadata: originalName
        ? { "nombre-original": encodeURIComponent(originalName) }
        : undefined,
    })
  );

  return toR2Path(key);
}

/**
 * Sube un stream directamente a R2 sin tocar el disco ni cargar el archivo
 * completo en memoria (usa subida multipart por partes de 8 MB).
 */
export async function uploadStreamToR2({
  body,
  key,
  contentType,
  originalName,
}: {
  body: Readable;
  key: string;
  contentType: string;
  originalName?: string;
}) {
  const upload = new Upload({
    client: getClient(),
    params: {
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: originalName
        ? { "nombre-original": encodeURIComponent(originalName) }
        : undefined,
    },
    queueSize: 3,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });

  await upload.done();

  return toR2Path(key);
}

export async function getObjectFromR2(key: string) {
  return getClient().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );
}

export async function copyObjectInR2(fromKey: string, toKey: string) {
  const bucket = getBucketName();
  const encodedSource = fromKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  await getClient().send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: toKey,
      CopySource: `${bucket}/${encodedSource}`,
    })
  );
}

export async function deleteObjectFromR2(key: string) {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );
}

export function isR2NotFoundError(error: unknown) {
  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    candidate?.name === "NoSuchKey" ||
    candidate?.$metadata?.httpStatusCode === 404
  );
}

export function streamBodyToResponse(
  body: unknown,
  response: NodeJS.WritableStream
) {
  if (!body) {
    throw new Error("Cloudflare R2 devolvió el archivo sin contenido.");
  }

  const candidate = body as {
    pipe?: (destination: NodeJS.WritableStream) => unknown;
    transformToWebStream?: () => unknown;
    transformToByteArray?: () => Promise<Uint8Array>;
  };

  if (typeof candidate.pipe === "function") {
    candidate.pipe(response);
    return;
  }

  if (typeof candidate.transformToWebStream === "function") {
    const webStream = candidate.transformToWebStream();
    Readable.fromWeb(webStream as any).pipe(response);
    return;
  }

  if (typeof candidate.transformToByteArray === "function") {
    void candidate.transformToByteArray().then((bytes) => {
      response.write(Buffer.from(bytes));
      response.end();
    });
    return;
  }

  throw new Error(
    "No se pudo convertir la respuesta de Cloudflare R2 en un flujo de lectura."
  );
}

export async function uploadBufferToR2({
  buffer,
  key,
  contentType,
  contentLength,
}: {
  buffer: Buffer;
  key: string;
  contentType: string;
  contentLength?: number;
}) {
  const client =
    getClient();

  await client.send(
    new PutObjectCommand({
      Bucket:
        getBucketName(),

      Key: key,

      Body: buffer,

      ContentType:
        contentType,

      ContentLength:
        contentLength,
    })
  );

  return toR2Path(key);
}