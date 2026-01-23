import { z } from "zod";

const horarioSchema = z.object({
  day: z.string(),
  from: z.string(), // HH:mm
  to: z.string(),   // HH:mm
});

export const configSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  slogan: z.string().optional(),

  moratoriumRate: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)),
  ]).refine((val) => !isNaN(val), {
    message: "Debe ser un número válido"
  }),

  paymentDeadlineDays: z.union([
    z.number(),
    z.string().transform((val) => parseInt(val)),
  ]).refine((val) => !isNaN(val) && val > 0, {
    message: "Debe ser un número entero positivo"
  }),
  maxGuestsNumberPerMonth: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(val.toString())),

  maxMemberReservationHoursPerDay: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(val.toString())),

  maxMemberReservationHoursPerDayAndSpace: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(val.toString())),

  devolutionReservationRate: z
    .union([z.string(), z.number()])
    .transform((val) => parseFloat(val.toString())),

  devolutionEventInscriptionRate: z
    .union([z.string(), z.number()])
    .transform((val) => parseFloat(val.toString())),

  devolutionAcademyInscriptionRate: z
    .union([z.string(), z.number()])
    .transform((val) => parseFloat(val.toString())),

  openHours: z.string().optional(),
  logoUrl: z.string(),
  portadaURL: z.string(),
});

//Tipado
export type ClubConfig = z.input<typeof configSchema>;