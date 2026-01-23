import { club } from '../../../db/schema/Club';
export declare class ClubService {
    static getClub(): Promise<{
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
    }>;
    static updateClub(data: Partial<typeof club.$inferInsert>): Promise<{
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
    } | null>;
}
