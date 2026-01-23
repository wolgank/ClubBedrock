import { z } from "zod";

export const DocSchema = z
  .instanceof(File)
  .refine(f => f.size <= 5 * 1024 * 1024, { message: "Máx 5 MB" })
  //.refine(f => f.type === "application/pdf", { message: "Solo PDF" }); //esto si queremos solo pdf
  
export const UploadDocResponseSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
});

export type UploadDocResponse = z.infer<typeof UploadDocResponseSchema>;