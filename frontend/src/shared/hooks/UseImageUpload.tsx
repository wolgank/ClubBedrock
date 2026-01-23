import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "../services/UploadService";
import { toast } from "sonner";

export function useImageUpload() {
  return useMutation({
    mutationFn: uploadImage,
    onError: (error: Error) => {
      toast.error("Error al subir la imagen", {
        description: error.message,
      });
    },
  });
}