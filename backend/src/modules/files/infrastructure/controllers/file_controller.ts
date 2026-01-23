import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Context } from "hono";
import {
  uploadFileLocal,
  downloadFileLocal,
  deleteFileLocal,
  uploadFileS3,
  downloadFileS3,
  deleteFileS3,
  uploadDocLocal,
} from "../../application/file_service";

// Local: Subir archivo
export const uploadLocalHandler = async (c: Context) => {
  try {
    // Validación con zValidator
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file || !(file instanceof File)) {
      return c.json({ error: "Archivo inválido" }, 400);
    }
    const fileName = await uploadFileLocal(file);
    return c.json({ fileName });
  }catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
};

export const uploadDocLocalHandler = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file || !(file instanceof File)) {
      return c.json({ error: "Archivo inválido" }, 400);
    }

    const { fileName, filePath } = await uploadDocLocal(file);
    return c.json({ fileName, filePath });
  } catch (err) {
    console.error(err);
    return c.json({ error: (err as Error).message }, 500);
  }
};
// Local: Descargar archivo
export const downloadLocalHandler = async (c: Context) => {
  try {
    const fileName = c.req.param("fileName");
    const file = await downloadFileLocal(fileName);
    return file;
  } catch (err) {
    console.error(err);
    return c.json({ error: "No se pudo descargar el archivo." }, 404);
  }
};

// Local: Eliminar archivo
export const deleteLocalHandler = async (c: Context) => {
  try {
    const fileName = c.req.param("fileName");
    await deleteFileLocal(fileName);
    return c.text("Archivo eliminado");
  } catch (err) {
    console.error(err);
    return c.json({ error: "No se pudo eliminar el archivo." }, 404);
  }
};

// S3: Subir archivo
export const uploadS3Handler = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "Archivo inválido" }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "Archivo demasiado grande. Límite: 10MB" }, 400);
    }

    const fileName = await uploadFileS3(file);
    return c.json({ fileName });
  } catch (err) {
    console.error(err);
    return c.json({ error: (err as Error).message }, 500);
  }
};


// S3: Descargar archivo
export const downloadS3Handler = async (c: Context) => {
  try {
    const fileName = c.req.param("fileName");
    const file = await downloadFileS3(fileName);
    return file;
  } catch (err) {
    console.error(err);
    return c.json({ error: "No se pudo generar el enlace de descarga." }, 404);
  }
};


// S3: Eliminar archivo
export const deleteS3Handler = async (c: Context) => {
  try {
    const fileName = c.req.param("fileName");
    await deleteFileS3(fileName);
    return c.text("Archivo eliminado de S3");
  } catch (err) {
    console.error(err);
    return c.json({ error: "No se pudo eliminar el archivo de S3." }, 404);
  }
};

