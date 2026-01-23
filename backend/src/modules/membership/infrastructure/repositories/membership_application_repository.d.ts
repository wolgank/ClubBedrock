export declare const findById: (id: number) => Promise<{
    id: number;
    idPosiblyPartner: number | null;
    applicantJobInfo: string;
    accountID: number;
    accountPosiblyPartnerID: number | null;
    idRecommendationMember1: number;
    idRecommendationMember2: number;
}>;
