import { z } from "zod";

export const DocType = z.enum(["DNI", "PASSPORT", "CE"]);

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

export const registrationSchema = z
  .object({
    /* datos personales */
    docType: DocType,
    docNumber: z.string().min(1, "Número de documento es obligatorio"),
    birthDate: z.coerce.date().max(eighteenYearsAgo, {
      message: "Debes tener al menos 18 años",
    }),
    names: z.string().min(1, "Nombres son obligatorios"),
    surnames: z.string().min(1, "Apellidos son obligatorios"),
    address: z.string().min(1, "Dirección es obligatoria"),
    workInfo: z.string().min(1, "Información laboral es obligatoria"),

    /* contacto */
    contactEmail: z.string().email("Correo electrónico inválido"),
    contactPhone: z
      .string()
      .regex(/^[1-9]\d{8}$/, "Debe ser un número válido de 9 dígitos"),

    /* cónyuge (opcional) */
    spouseDocType: DocType.optional(),
    spouseDocNumber: z.string().optional(),
    spouseBirthDate: z.string().optional(),
    spouseNames: z.string().optional(),
    spouseSurnames: z.string().optional(),
    spouseEmail: z
      .string()
      .email("Correo electrónico inválido")
      .optional()
      .or(z.literal("")),
    spousePhone: z.string().optional(),
    spouseUsername: z.string().optional(),
    spousePassword: z.string().optional(),

    /* socios */
    sponsor1Id: z.string().min(1, "ID del socio 1 es obligatorio"),
    sponsor1Name: z.string().min(1, "Nombre del socio 1 es obligatorio"),
    sponsor2Id: z.string().min(1, "ID del socio 2 es obligatorio"),
    sponsor2Name: z.string().min(1, "Nombre del socio 2 es obligatorio"),

    /* términos */
    acceptTerms: z
      .boolean()
      .default(false)
      .refine(value => value === true, {
        message: "Debes aceptar los términos y condiciones",
      }),

    /* archivos dinámicos */
    dynamicFiles: z.record(z.any()).optional(),
  })
  /* validación de longitud según tipo de documento */
  .refine(data => {
    const { docType, docNumber } = data;
    if (docType === "DNI") return /^\d{8}$/.test(docNumber);
    if (docType === "PASSPORT") return /^[A-Za-z0-9]{10}$/.test(docNumber);
    if (docType === "CE") return /^[A-Za-z0-9]{12}$/.test(docNumber);
    return false;
  }, {
    path: ["docNumber"],
    message: "Número de documento inválido para el tipo seleccionado",
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;