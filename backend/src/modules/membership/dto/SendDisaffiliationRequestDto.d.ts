export type SendDisaffiliationRequestDto = {
    membership: number;
    memberReason?: string;
    changeStartDate: Date;
};
