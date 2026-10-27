import "dotenv/config";

import {
  applicationDefault,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Falta FIREBASE_ADMIN_PROJECT_ID en el .env del backend."
  );
}

const appName = "talentia-admin";

const existingApp = getApps().find(
  (app) => app.name === appName
);

const firebaseAdminApp =
  existingApp ??
  initializeApp(
    {
      credential: applicationDefault(),
      projectId,
    },
    appName
  );

export const firestoreAdmin = getFirestore(firebaseAdminApp);