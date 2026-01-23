import { z } from "zod";

export const defaultAccountSchema = z.object({
  auth: z.object({
    id: z.number().default(0),
    email: z.string().default("default@email.com"),
    username: z.string().default("defaultUser"),
    password: z.string().optional(),
    role: z.enum(["ADMIN", "SPORTS", "EVENTS", "MEMBERSHIP", "MEMBER", "GUEST"]).default("GUEST"),
    isActive: z.boolean().optional().default(true),
    googleId: z.string().optional(),
    oauthProvider: z.string().optional().nullable(),
  }).default({}), // default empty object

  user: z.object({
    lastname: z.string().default("Default Lastname"),
    name: z.string().default("Default Name"),
    documentType: z.enum(["DNI", "PASSPORT", "CE"]).optional().nullable().default("DNI"),
    documentID: z.string().optional().nullable().default("12345678"),
    phoneNumber: z.string().default("000000000"),
    birthDate: z.coerce.date().default(new Date("2000-01-01")),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().default("MALE"),
    address: z.string().default("Default Address"),
    profilePictureURL: z.string().default("https://example.com/default.jpg"),
    id: z.number().int().default(0),
    accountID: z.number().optional().nullable(),
  }).default({}), // default empty object
});

// Tipo inferido de Zod
export type DefaultAccount = z.infer<typeof defaultAccountSchema>;
