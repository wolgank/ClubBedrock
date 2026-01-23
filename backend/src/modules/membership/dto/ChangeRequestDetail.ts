/**
 * Detalle de una solicitud de cambio de membresía (suspensión o desafiliación).
 */
export type ChangeRequestDetail = {
  membershipCode: string;
  titularName: string;
  titularLastName: string;
  membershipState: string;
  memberReason: string | null;
  changeStartDate: Date;
  changeEndDate: Date | null;
};