export type SendSuspensionRequestDto = {
    membership: number;
    memberReason?: string;
    changeStartDate: Date;
    changeEndDate?: Date;
};
