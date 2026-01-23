export type SendDisaffiliationRequestDto = {
  membership: number;
  memberReason?: string;
  changeStartDate: Date;
  // changeEndDate no aplica aquí, pues la desafiliación termina la membresía
};