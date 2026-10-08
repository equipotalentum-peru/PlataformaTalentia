import multer from "multer";

const storage =
  multer.memoryStorage();

export const recibirAdjuntoChat =
  multer({
    storage,

    limits: {
      fileSize:
        20 * 1024 * 1024,
    },
  });