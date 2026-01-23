import { z } from "zod";

export const DocumentFormatSchema = z.object({
  id: z.number(),
  isForInclusion: z.boolean(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  memberTypeForDocument: z.number(),
});
export type DocumentFormat = z.infer<typeof DocumentFormatSchema>;


export const MemberTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  inclusionCost: z.number(),
  exclusionCost: z.number(),
  canPayAndRegister: z.boolean(),
  costInMembershipFee: z.number(),
  active: z.boolean(),
});

export type MemberType = z.infer<typeof MemberTypeSchema>;


export const DocumentFormatInputSchema = z.object({
  isForInclusion: z.boolean(),
  name: z.string().min(1, "El nombre del documento es requerido"),
  description: z.string().min(1,"Una descripción del documento es requerida"),
});

export type DocumentFormatInput = z.infer<typeof DocumentFormatInputSchema>;

export const MemberTypeWithDocsInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "El nombre del vínculo es requerido"),
  description: z.string().optional(),
  inclusionCost: z.number().min(0, "Debe ser mayor o igual a 0"),
  exclusionCost: z.number().min(0, "Debe ser mayor o igual a 0"),
  costInMembershipFee: z.number().min(0, "Debe ser mayor o igual a 0"),
  canPayAndRegister: z.boolean(),
  documentFormats: z
    .array(DocumentFormatInputSchema)
    .min(1, "Debe incluir al menos un documento"),
  active: z.boolean().default(true)
});

export type MemberTypeWithDocsInput = z.infer<typeof MemberTypeWithDocsInputSchema>;

// export const VinculoSchema = z.object({
//   nombre: z.string().min(1, "El nombre del vínculo es requerido"),
//   descripcion: z.string().optional(),
//   costoInclusion: z.number().min(0, "El costo debe ser mayor o igual a 0"),
//   costoExclusion: z.number().min(0, "El costo debe ser mayor o igual a 0"),
//   costoCuotaMembresia: z.number().min(0, "El costo debe ser mayor o igual a 0"),
//   documentosSolicitados: z
//     .array(DocumentoSchema)
//     .min(1, "Debe incluir al menos un documento"),
// });

// export type VinculoInput = z.infer<typeof VinculoSchema>;
// export type DocumentoInput = z.infer<typeof DocumentoSchema>;

// // Schema adicional para la respuesta (que incluye el id)
// export const VinculoResponseSchema = VinculoSchema.extend({
//     id: z.number(),
//   });

//   export type VinculoResponse = z.infer<typeof VinculoResponseSchema>;  
