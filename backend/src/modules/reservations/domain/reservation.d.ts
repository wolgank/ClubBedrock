import { z } from "zod";
export declare const createReservationSchema: z.ZodObject<{
    date: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capacity: z.ZodNumber;
    startHour: z.ZodString;
    endHour: z.ZodString;
    allowOutsiders: z.ZodBoolean;
    spaceId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    name: string;
    capacity: number;
    startHour: string;
    endHour: string;
    allowOutsiders: boolean;
    spaceId: number;
    description?: string | undefined;
}, {
    date: string;
    name: string;
    capacity: number;
    startHour: string;
    endHour: string;
    allowOutsiders: boolean;
    spaceId: number;
    description?: string | undefined;
}>;
export type CreateReservation = z.infer<typeof createReservationSchema>;
export declare const reservationSchema: z.ZodObject<{
    name: z.ZodString;
    startHour: z.ZodString;
    endHour: z.ZodString;
    capacity: z.ZodNumber;
    allowOutsiders: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    spaceId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    capacity: number;
    startHour: string;
    endHour: string;
    allowOutsiders: boolean;
    spaceId: number;
    description?: string | undefined;
}, {
    name: string;
    capacity: number;
    startHour: string;
    endHour: string;
    allowOutsiders: boolean;
    spaceId: number;
    description?: string | undefined;
}>;
