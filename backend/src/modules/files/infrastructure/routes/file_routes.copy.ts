// src/infrastructure/routes/files.ts
import { Hono } from "hono";
import {
  uploadLocalHandler,
  downloadLocalHandler,
  deleteLocalHandler,
  uploadS3Handler,
  downloadS3Handler,
  deleteS3Handler,
  uploadDocLocalHandler,
} from "../controllers/file_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";

const fileRoutes = new Hono()
  //hace que guardes la imagen en una carpeta llamada uploads
  .post("/upload", authMiddleware, uploadS3Handler)
  .post("/uploadDoc", authMiddleware, uploadS3Handler)

  //te devuelve la imagen

  .get("/download/:fileName", downloadS3Handler)

  .delete("/delete/:fileName", authMiddleware, deleteS3Handler)

  .post("/upload-s3", authMiddleware, uploadS3Handler)
  .get("/download-s3/:fileName", authMiddleware, downloadS3Handler)
  .delete("/delete-s3/:fileName", authMiddleware, deleteS3Handler);

export default fileRoutes;
