import "dotenv/config";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const R2_PATH_PREFIX = "r2://";

const accountId =
  process.env.R2_ACCOUNT_ID?.trim() ?? "";

const bucketName =
  process.env.R2_BUCKET_NAME?.trim() ?? "";

const accessKeyId =
  process.env.R2_ACCESS_KEY_ID?.trim() ?? "";

const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";

const endpoint =
  process.env.R2_ENDPOINT?.trim() ||
  (accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : "");

function getClient() {
  if (
    !accountId ||
    !bucketName ||
    !accessKeyId ||
    !secretAccessKey ||
    !endpoint
  ) {
    throw new Error(
      "Cloudflare R2 no está configurado. Revisa R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_ENDPOINT."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName() {
  if (!bucketName) {
    throw new Error(
      "Falta configurar R2_BUCKET_NAME en el archivo .env"
    );
  }

  return bucketName;
}

export function isR2Path(value: string) {
  return value.startsWith(
    R2_PATH_PREFIX
  );
}

export function stripR2Prefix(
  value: string
) {
  return value.slice(
    R2_PATH_PREFIX.length
  );
}

export function toR2Path(
  key: string
) {
  return `${R2_PATH_PREFIX}${key}`;
}

export function createCourseContentKey({
  courseId,
  moduleId,
  originalName,
}: {
  courseId: number;
  moduleId: number;
  originalName: string;
}) {
  const extension =
    path
      .extname(originalName)
      .toLowerCase();

  const uniqueName =
    `${randomUUID()}${extension}`;

  return `courses/${courseId}/modules/${moduleId}/contents/${uniqueName}`;
}

export async function uploadFileToR2({
  filePath,
  key,
  contentType,
  contentLength,
}: {
  filePath: string;
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

      Body:
        createReadStream(
          filePath
        ),

      ContentType:
        contentType,

      ContentLength:
        contentLength,
    })
  );

  return toR2Path(key);
}

export async function getObjectFromR2(
  key: string
) {
  const client =
    getClient();

  return client.send(
    new GetObjectCommand({
      Bucket:
        getBucketName(),

      Key: key,
    })
  );
}

export async function deleteObjectFromR2(
  key: string
) {
  const client =
    getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket:
        getBucketName(),

      Key: key,
    })
  );
}

export function streamBodyToResponse(
  body: unknown,
  response: NodeJS.WritableStream
) {
  if (!body) {
    throw new Error(
      "Cloudflare R2 devolvió el archivo sin contenido."
    );
  }

  const candidate =
    body as {
      pipe?: (
        destination: NodeJS.WritableStream
      ) => unknown;

      transformToWebStream?: () => unknown;

      transformToByteArray?: () =>
        Promise<Uint8Array>;
    };

  if (
    typeof candidate.pipe ===
    "function"
  ) {
    candidate.pipe(
      response
    );

    return;
  }

  if (
    typeof candidate.transformToWebStream ===
    "function"
  ) {
    const webStream =
      candidate.transformToWebStream();

    const nodeStream =
      Readable.fromWeb(
        webStream as any
      );

    nodeStream.pipe(
      response
    );

    return;
  }

  if (
    typeof candidate.transformToByteArray ===
    "function"
  ) {
    void candidate
      .transformToByteArray()
      .then((bytes) => {
        response.write(
          Buffer.from(bytes)
        );

        response.end();
      });

    return;
  }

  throw new Error(
    "No se pudo convertir la respuesta de Cloudflare R2 en un flujo de lectura."
  );
}