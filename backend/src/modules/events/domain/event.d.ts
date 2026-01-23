import { z } from "zod";
export declare const createEventSchema: z.ZodObject<{
    reservationId: z.ZodNumber;
    ticketPriceGuest: z.ZodNumber;
    ticketPriceMember: z.ZodNumber;
    date: z.ZodString;
    name: z.ZodString;
    isActive: z.ZodBoolean;
    description: z.ZodString;
    capacity: z.ZodNumber;
    urlImage: z.ZodString;
    startHour: z.ZodString;
    endHour: z.ZodString;
    allowOutsiders: z.ZodBoolean;
    spaceUsed: z.ZodString;
    numberOfAssistants: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    name: string;
    isActive: boolean;
    description: string;
    reservationId: number;
    capacity: number;
    urlImage: string;
    startHour: string;
    endHour: string;
    allowOutsiders: boolean;
    spaceUsed: string;
    ticketPriceMember: number;
    ticketPriceGuest: number;
    numberOfAssistants: number;
}, {
    date: string;
    name: string;
    isActive: boolean;
    description: string;
    reservationId: number;
    capacity: number;
    urlImage: string;
    startHour: string;
    endHour: string;
    allowOutsiders: boolean;
    spaceUsed: string;
    ticketPriceMember: number;
    ticketPriceGuest: number;
    numberOfAssistants: number;
}>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export declare const querySchemaEvents: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    startHour: z.ZodOptional<z.ZodString>;
    endHour: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    allowOutsiders: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    orden: z.ZodDefault<z.ZodEnum<["reciente", "antiguo"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    size: number;
    orden: "reciente" | "antiguo";
    date?: string | undefined;
    isActive?: boolean | undefined;
    startHour?: string | undefined;
    endHour?: string | undefined;
    allowOutsiders?: boolean | undefined;
}, {
    date?: string | undefined;
    isActive?: boolean | undefined;
    startHour?: string | undefined;
    endHour?: string | undefined;
    allowOutsiders?: boolean | undefined;
    page?: number | undefined;
    size?: number | undefined;
    orden?: "reciente" | "antiguo" | undefined;
}>;
export interface EventFilter {
    page: number;
    size: number;
    orden: 'reciente' | 'antiguo';
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    startHour: string | null;
    endHour: string | null;
    allowOutsiders: boolean;
}
