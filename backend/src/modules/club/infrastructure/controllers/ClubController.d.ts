import type { Context } from 'hono';
export declare class ClubController {
    getConfig(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: number;
        name: string;
        slogan: string;
        logoUrl: string | null;
        moratoriumRate: string;
        maxMemberReservationHoursPerDayAndSpace: number;
        maxMemberReservationHoursPerDay: number;
        maxGuestsNumberPerMonth: number;
        devolutionReservationRate: string;
        devolutionEventInscriptionRate: string;
        devolutionAcademyInscriptionRate: string;
        portadaURL: string | null;
        address: string | null;
        openHours: string | null;
        email: string | null;
        phone: string | null;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    updateConfig(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
        details: {
            _errors: string[];
            id?: {
                _errors: string[];
            } | undefined;
            email?: {
                _errors: string[];
            } | undefined;
            name?: {
                _errors: string[];
            } | undefined;
            address?: {
                _errors: string[];
            } | undefined;
            phone?: {
                _errors: string[];
            } | undefined;
            slogan?: {
                _errors: string[];
            } | undefined;
            logoUrl?: {
                _errors: string[];
            } | undefined;
            moratoriumRate?: {
                _errors: string[];
            } | undefined;
            maxMemberReservationHoursPerDayAndSpace?: {
                _errors: string[];
            } | undefined;
            maxMemberReservationHoursPerDay?: {
                _errors: string[];
            } | undefined;
            maxGuestsNumberPerMonth?: {
                _errors: string[];
            } | undefined;
            devolutionReservationRate?: {
                _errors: string[];
            } | undefined;
            devolutionEventInscriptionRate?: {
                _errors: string[];
            } | undefined;
            devolutionAcademyInscriptionRate?: {
                _errors: string[];
            } | undefined;
            portadaURL?: {
                _errors: string[];
            } | undefined;
            openHours?: {
                _errors: string[];
            } | undefined;
        };
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        name: string;
        slogan: string;
        logoUrl: string | null;
        moratoriumRate: string;
        maxMemberReservationHoursPerDayAndSpace: number;
        maxMemberReservationHoursPerDay: number;
        maxGuestsNumberPerMonth: number;
        devolutionReservationRate: string;
        devolutionEventInscriptionRate: string;
        devolutionAcademyInscriptionRate: string;
        portadaURL: string | null;
        address: string | null;
        openHours: string | null;
        email: string | null;
        phone: string | null;
    } | null, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
