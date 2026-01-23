import type { MembershipChangeType } from "../../../shared/enums/MembershipChangeType";
/**
 * DTO para que un gestor cree y apruebe inmediatamente un cambio de membresía.
 */
export type ManagerChangeRequestDto = {
    membership: number;
    type: MembershipChangeType;
    managerNotes?: string;
    changeStartDate: Date;
    changeEndDate?: Date;
};
