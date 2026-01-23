import { UploadDocResponse, UploadDocResponseSchema } from "../schemas/FileSchema";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  //console.log(formData);
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/upload`, {
    method: "POST",
    body: formData,
    credentials : "include"
  });

  if (!res.ok) throw new Error("Error al subir imagen");

  const data = await res.json();

  // Asegúrate de acceder a la propiedad correcta (fileName en camelCase)
  if (!data.fileName) throw new Error("Formato de respuesta inválido: falta 'fileName'");

  return `${import.meta.env.VITE_BACKEND_URL}/files/download/${data.fileName}`;; // Usa SIEMPRE este valor hasheado del backend
}




export async function uploadDoc(file: File): Promise<UploadDocResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/uploadDoc`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Error al subir archivo: ${response.statusText}`);
  }

  // Validamos que la respuesta tenga la estructura esperada
  const parseResult = UploadDocResponseSchema.safeParse(json);
  if (!parseResult.success) {
    console.error("Respuesta no válida del backend:", parseResult.error);
    throw new Error("Respuesta inesperada del servidor.");
  }

  return parseResult.data;
}