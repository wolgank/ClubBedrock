// src/hooks/useUploadDoc.ts
import { useMutation } from "@tanstack/react-query";
import { uploadDoc } from "../services/UploadService";
import { DocSchema, UploadDocResponse, UploadDocResponseSchema } from "../schemas/FileSchema";

export function useUploadDoc() {
  return useMutation({
    mutationKey: ["uploadDoc"],
    mutationFn: async (file: File) => {
      // valida antes de enviar
      const parsed = DocSchema.safeParse(file);
      if (!parsed.success) {
        throw parsed.error;            // TanStack eror
      }
      return uploadDoc(file);          // envía al backend
    },
  });
}
