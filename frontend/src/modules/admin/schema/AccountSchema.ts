import { z } from "zod";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

// Esquema base que valida solo tipos de datos
export const baseAuthSchema = z.object({
  id: z.number().default(0),
  email: z.string().min(5, { message: 'El email debe tener al menos 5 caracteres' })
    .max(255, { message: 'El email no puede tener más de 255 caracteres' })
    .email({ message: 'Debe ser un correo válido (ejemplo@dominio.com)' })
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, { message: 'Formato de correo inválido' }),
  username: z
    .string()
    //.min(3, { message: 'El username debe tener al menos 3 caracteres' }) //ARIEL:ESTO DEBERÍA SER 3, PERO DEJO EN 1 POR CUENTAS MAL REGISTRADAS ACTUALMENTE
    .max(255, { message: 'El username no puede tener más de 255 caracteres' })
    .optional(),

  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(255)
    .optional()
    .nullable(),

  role: z.enum(["ADMIN", "SPORTS", "EVENTS", "MEMBERSHIP", "MEMBER", "GUEST"], { message: "Rol no válido" }).default("GUEST"),

  isActive: z.boolean().optional(),

  googleId: z.string().optional(),

  oauthProvider: z.string().optional().nullable(),
});

export type BaseAuth = z.infer<typeof baseAuthSchema>;


export const baseUserSchema = z.object({
  lastname: z.string()
    .min(1, { message: "El apellido es obligatorio" })
    .max(100, { message: "El apellido no puede superar los 100 caracteres" }),

  name: z.string()
    .min(1, { message: "El nombre es obligatorio" })
    .max(100, { message: "El nombre no puede superar los 100 caracteres" }),

  documentType: z.enum(["DNI", "PASSPORT", "CE"]).optional().nullable(),

  documentID: z.string().min(1, { message: "El documento de identidad es obligatorio" }).optional().nullable(),

  phoneNumber: z.string()
    .max(9, { message: "El número de teléfono no puede superar los 9 caracteres" })
    .regex(/^\d{1,9}$/, {
      message: "El número de teléfono debe contener solo dígitos",
    })
    .optional(),

  birthDate: z.coerce.date().max(eighteenYearsAgo, {
    message: "Debes tener al menos 18 años",
  }).optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Género no válido"
  }).optional(),

  address: z.string()
    .max(100, { message: "La dirección no puede superar los 100 caracteres" })
    .optional(),

  profilePictureURL: z.string()
    .min(1, { message: "Falta subir la foto de perfil" })
    .url({ message: "La foto debe ser un enlace válido (URL)" })
    .optional(),

  id: z.number().int(),
  accountID: z.number().optional().nullable(),
}).superRefine((data, ctx) => {
  const { documentType, documentID } = data;

  if (!documentType || !documentID || documentID.trim() === "") return;

  const value = documentID.trim();

  let isValid = true;
  let expectedFormat = "";

  switch (documentType) {
    case "DNI":
      isValid = /^\d{8}$/.test(value);
      expectedFormat = "DNI debe tener exactamente 8 dígitos numéricos (ej: 12345678)";
      break;
    case "PASSPORT":
      isValid = /^[A-Za-z0-9]{10}$/.test(value);
      expectedFormat = "Pasaporte debe tener exactamente 10 caracteres alfanuméricos (ej: AB123456CD)";
      break;
    case "CE":
      isValid = /^[A-Za-z0-9]{12}$/.test(value);
      expectedFormat = "Carnet de Extranjería debe tener 12 caracteres alfanuméricos (ej: A1B2C3D4E5F6)";
      break;
  }

  if (!isValid) {
    ctx.addIssue({
      path: ["documentID"],
      code: z.ZodIssueCode.custom,
      message: expectedFormat,
    });
  }
});

// Esquema para la salida (respuesta del servidor), con 'id'
export const accountSchema = z.object({
  auth: baseAuthSchema,  // Usa el esquema base con 'id'
  user: baseUserSchema         // Usa el esquema base con 'id'
});

export type Account = z.infer<typeof accountSchema>;


export const defaultAccount: Account = {
  auth: {
    id: 0,
    username: "",
    email: "",
    googleId: "",
    isActive: true,
    oauthProvider: "",
    password: "",
    role: null,
  },
  user: {
    id: 0,
    address: "",
    birthDate: null,
    documentID: "",
    documentType: null,
    gender: null,
    lastname: "",
    name: "",
    phoneNumber: "",
    profilePictureURL: "",
    accountID: 0,
  }
}


export const registerAccountSchema = z.object({
  auth: baseAuthSchema.extend({
    password: z.string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
      .max(255),
  }).omit({ id: true }),
  user: baseUserSchema,     // Detalles del usuario
});
export type RegisterAccountInput = z.infer<typeof registerAccountSchema>;

// Esquema para la entrada (creación de cuenta), sin 'id'
// export const updateAccountSchema = z.object({
//   auth: baseAuthSchema//.omit({ id: true })
//     .transform((data) => {
//       // Si googleId es una cadena vacía, lo eliminamos del objeto
//       if (data.googleId === "") {
//         // Usamos desestructuración para eliminar googleId sin afectar el resto de los datos
//         const { googleId, ...rest } = data;
//         return rest; // Regresamos el objeto sin googleId
//       }
//       return data; // Si no es vacío, regresamos los datos tal cual
//     })
// });
// export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const updateAccountSchema = z.object({
  auth: baseAuthSchema,
  user: baseUserSchema,
}).transform(({ auth, user }) => ({
  auth,
  user: {
    ...user,
    accountID: auth.id,
  },
}));


export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
