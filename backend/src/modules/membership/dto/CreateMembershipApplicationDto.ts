import { string, z } from "zod";
import { documentType } from "../../../shared/enums/DocumentType";
import { requestState } from "../../../shared/enums/RequestState";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RecommendationSchema = z.object({
  subCodeInserted:      z.string().max(50),
  namesAndLastNamesInserted: z.string().max(255),
});

export type RecommendationDto = z.infer<typeof RecommendationSchema>;

export const InclusionSchema = z.object({
  newMemberDocumentType: z.enum(documentType),
  newMemberDocumentId:   z.string().min(1).max(50),
  newMemberName:         z.string().min(1).max(50),
  newMemberLastName:     z.string().min(1).max(50),
 // newMemberType:         z.number().int(), //es para el TITULAR por defecto.
  newMemberAddress:      z.string().min(1).max(255),
  newMemberEmail:        z.string().email().regex(emailRegex),
  newMemberPhone:        z.string().min(1).max(50),
  newMemberBirthDate:    z.coerce.date(),
});

export type InclusionDto = z.infer<typeof InclusionSchema>;

// 2) Esquema “laxo” para el solicitante principal
export const LaxInclusionSchema = InclusionSchema.extend({
  newMemberEmail: z.string().optional(),  // ya no es obligatorio ni validado
});
export type LaxInclusionDto = z.infer<typeof LaxInclusionSchema>;

export const createMembershipApplicationSchema = z.object({
  inclusion:       LaxInclusionSchema,

  // 2b) Inclusion opcional del partner
  partnerInclusion: InclusionSchema.optional(),
  partnerUsername: string().max(100).optional(),
  partnerPassword: string().min(8).max(100).optional(),
  // 3) Dos recomendaciones
  recommendation1: RecommendationSchema,
  recommendation2: RecommendationSchema,

  // 4) Datos finales de la aplicación
  applicantJobInfo: z.string().min(1).max(250),
  //accountID:        z.number().int().optional(),  // FK a Auth.id, NO PONER NADA AQUÍ XD LO DA EL JWT
}).superRefine((val, ctx) => {
    // Si hay datos de inclusion para partner, username y password **son obligatorios**
    if (val.partnerInclusion) {
      if (!val.partnerUsername) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "partnerUsername es requerido cuando hay partnerInclusion",
          path: ["partnerUsername"],
        });
      }
      if (!val.partnerPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "partnerPassword es requerido cuando hay partnerInclusion",
          path: ["partnerPassword"],
        });
      }
    }
  });;

export type CreateMembershipApplicationDto =
  z.infer<typeof createMembershipApplicationSchema>;
