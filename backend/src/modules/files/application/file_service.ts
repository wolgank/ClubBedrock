import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { randomBytes } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { lookup } from "mime-types";
import { extname } from "path";
function getMimeType(fileName: string): string {
  return lookup(fileName) || "application/octet-stream";
}
// ⚙️ Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN, // Opcional, si usas credenciales temporales
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const LOCAL_DIR = path.resolve(process.env.FILE_UPLOAD_DIR || "/uploads"); // Puedes cambiar la ruta si usas otra

const generateFileName = (bytes = 16) => randomBytes(bytes).toString("hex");

// 🌐 LOCAL SERVICES

// export async function uploadFileLocal(file: File): Promise<string> {
//   const buffer = await file.arrayBuffer()
//   const fileBuffer = await sharp(Buffer.from(buffer))
//     .resize({ width: 1080, height: 1920, fit: 'contain' })
//     .toBuffer()
//   const originalExt = extname(file.name);
//   const fileName = `${generateFileName()}${originalExt}`;
//   await fs.mkdir(LOCAL_DIR, { recursive: true })
//   await fs.writeFile(path.join(LOCAL_DIR, fileName), fileBuffer)

//   return fileName
// }

export async function uploadFileLocal(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const sharpImage = sharp(Buffer.from(buffer));

  const metadata = await sharpImage.metadata();

  const maxWidth = 1920;
  const maxHeight = 1080;

  let fileBuffer: Buffer;

  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    // Si la imagen es mayor en alguna dimensión, redimensionar
    fileBuffer = await sharpImage
      .resize({ width: maxWidth, height: maxHeight, fit: "contain" })
      .toBuffer();
  } else {
    // Si no, guardar sin redimensionar
    fileBuffer = Buffer.from(buffer);
  }

  const originalExt = extname(file.name);
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf'];
  if (!allowedExtensions.includes(originalExt)) {
    throw new Error(`Extensión de archivo no permitida: ${originalExt}`);
  }
  const fileName = `${generateFileName()}${originalExt}`;

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, fileName), fileBuffer);

  return fileName;
}

/**
 * Guarda un documento (PDF, DOCX, XLSX, etc.) en disco local sin alterarlo.
 * @param file El objeto File proveniente del frontend (por ejemplo, un PDF).
 * @returns El nombre de archivo interno (random + extensión) que se guardó en LOCAL_DIR.
 */
export async function uploadDocLocal(
  file: File
): Promise<{ fileName: string; filePath: string }> {
  // 1) Leer el contenido crudo del archivo
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2) Obtener la extensión original (incluyendo el punto), p. ej. “.pdf”
  const originalExt = extname(file.name);
  // Validar extensión permitida
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf'];
  if (!allowedExtensions.includes(originalExt)) {
    throw new Error(`Extensión de archivo no permitida: ${originalExt}`);
  }
  // 3) Generar un nombre único + mantener extensión original
  const fileName = `${generateFileName()}${originalExt}`;

  // 4) Asegurarnos de que la carpeta exista
  await fs.mkdir(LOCAL_DIR, { recursive: true });

  // 5) Escribir el buffer en disco
  await fs.writeFile(path.join(LOCAL_DIR, fileName), buffer);
  const filePath = path.join(LOCAL_DIR, fileName);
  //console.log("filePath o url obtenida: ", filePath);
  return { fileName, filePath };
}

export async function downloadFileLocal(fileName: string) {
  const filePath = path.join(LOCAL_DIR, fileName);
  const data = await fs.readFile(filePath);
  const contentType = getMimeType(fileName);
  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}

export async function deleteFileLocal(fileName: string): Promise<void> {
  const filePath = path.join(LOCAL_DIR, fileName);
  await fs.unlink(filePath);
}

// ☁️ S3 SERVICES

export async function uploadFileS3(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  // Extraer la extensión y convertirla a minúsculas
  const originalName = file.name;
  const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();

  // Validar extensión permitida
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf'];
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Extensión de archivo no permitida: ${extension}`);
  }

  // Generar nombre único con extensión
  const fileName = generateFileName() + extension;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Body: Buffer.from(buffer),
    Key: fileName,
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  return fileName;
}

export async function downloadFileS3(fileName: string) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  };

  const command = new GetObjectCommand(params);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
}

export async function deleteFileS3(fileName: string): Promise<void> {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  };

  await s3Client.send(new DeleteObjectCommand(deleteParams));
}
