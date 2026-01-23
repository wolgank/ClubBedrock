import { z } from "zod";
import { ZodIssue } from "zod";
const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

export const registrationPayloadSchema = z.object({
  documentType: z.enum(["DNI", "PASSPORT", "CE"], {
    required_error: "El tipo de documento es obligatorio",
  }),

  documentId: z.string().min(1, "El número de documento es obligatorio"),

  birthDate: z.coerce.date().max(eighteenYearsAgo, {
    message: "Debes tener al menos 18 años",
  }),

  names: z.string()
    .min(1, { message: "Los nombres son obligatorios" })
    .max(100, { message: "Máximo 100 caracteres para nombres" }),

  lastnames: z.string()
    .min(1, { message: "Los apellidos son obligatorios" })
    .max(100, { message: "Máximo 100 caracteres para apellidos" }),

  memberTypeId: z.number({
    required_error: "Debe seleccionar un tipo de miembro válido",
  }).int().positive({ message: "ID de tipo de miembro inválido" }),

  email: z.string()
    .email({ message: "Correo no válido" })
    .max(255, { message: "Máximo 255 caracteres para el correo" }),

  username: z.string()
    .min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" })
    .max(100, { message: "Máximo 100 caracteres para el usuario" }),

  password: z.string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(255, { message: "Máximo 255 caracteres para la contraseña" }),

  phone: z.string()
    .regex(/^\d{9}$/, { message: "El número de teléfono debe tener 9 dígitos" }),

  reason: z.string()
    .max(255, { message: "Máximo 255 caracteres para el motivo de la relación" })
    .optional(),
})
.refine((data) => {
  const { documentType, documentId } = data;

  if (!documentType || !documentId) return true;

  switch (documentType) {
    case "DNI":
      return /^\d{8}$/.test(documentId);
    case "PASSPORT":
      return /^[A-Za-z0-9]{10}$/.test(documentId);
    case "CE":
      return /^[A-Za-z0-9]{12}$/.test(documentId);
    default:
      return false;
  }
}, {
  message: "Número de documento inválido para el tipo seleccionado",
});
export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;




export function formatZodErrors(issues: ZodIssue[]): string {
  return issues
    .map(issue => {
      const label = issue.path?.length > 0
        ? `${issue.path.join(".")}`
        : "General";
      return `• ${label}: ${issue.message}`;
    })
    .join("\n");
}