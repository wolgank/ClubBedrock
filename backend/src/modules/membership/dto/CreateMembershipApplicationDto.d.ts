import { z } from "zod";
export declare const RecommendationSchema: z.ZodObject<{
    subCodeInserted: z.ZodString;
    namesAndLastNamesInserted: z.ZodString;
}, "strip", z.ZodTypeAny, {
    subCodeInserted: string;
    namesAndLastNamesInserted: string;
}, {
    subCodeInserted: string;
    namesAndLastNamesInserted: string;
}>;
export type RecommendationDto = z.infer<typeof RecommendationSchema>;
export declare const InclusionSchema: z.ZodObject<{
    newMemberDocumentType: z.ZodEnum<["DNI", "CE", "PASSPORT"]>;
    newMemberDocumentId: z.ZodString;
    newMemberName: z.ZodString;
    newMemberLastName: z.ZodString;
    newMemberAddress: z.ZodString;
    newMemberEmail: z.ZodString;
    newMemberPhone: z.ZodString;
    newMemberBirthDate: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
    newMemberDocumentId: string;
    newMemberName: string;
    newMemberLastName: string;
    newMemberAddress: string;
    newMemberEmail: string;
    newMemberPhone: string;
    newMemberBirthDate: Date;
}, {
    newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
    newMemberDocumentId: string;
    newMemberName: string;
    newMemberLastName: string;
    newMemberAddress: string;
    newMemberEmail: string;
    newMemberPhone: string;
    newMemberBirthDate: Date;
}>;
export type InclusionDto = z.infer<typeof InclusionSchema>;
export declare const createMembershipApplicationSchema: z.ZodEffects<z.ZodObject<{
    inclusion: z.ZodObject<{
        newMemberDocumentType: z.ZodEnum<["DNI", "CE", "PASSPORT"]>;
        newMemberDocumentId: z.ZodString;
        newMemberName: z.ZodString;
        newMemberLastName: z.ZodString;
        newMemberAddress: z.ZodString;
        newMemberEmail: z.ZodString;
        newMemberPhone: z.ZodString;
        newMemberBirthDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    }, {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    }>;
    partnerInclusion: z.ZodOptional<z.ZodObject<{
        newMemberDocumentType: z.ZodEnum<["DNI", "CE", "PASSPORT"]>;
        newMemberDocumentId: z.ZodString;
        newMemberName: z.ZodString;
        newMemberLastName: z.ZodString;
        newMemberAddress: z.ZodString;
        newMemberEmail: z.ZodString;
        newMemberPhone: z.ZodString;
        newMemberBirthDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    }, {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    }>>;
    partnerUsername: z.ZodOptional<z.ZodString>;
    partnerPassword: z.ZodOptional<z.ZodString>;
    recommendation1: z.ZodObject<{
        subCodeInserted: z.ZodString;
        namesAndLastNamesInserted: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    }, {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    }>;
    recommendation2: z.ZodObject<{
        subCodeInserted: z.ZodString;
        namesAndLastNamesInserted: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    }, {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    }>;
    applicantJobInfo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    inclusion: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    };
    applicantJobInfo: string;
    recommendation1: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    recommendation2: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    partnerInclusion?: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    } | undefined;
    partnerUsername?: string | undefined;
    partnerPassword?: string | undefined;
}, {
    inclusion: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    };
    applicantJobInfo: string;
    recommendation1: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    recommendation2: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    partnerInclusion?: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    } | undefined;
    partnerUsername?: string | undefined;
    partnerPassword?: string | undefined;
}>, {
    inclusion: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    };
    applicantJobInfo: string;
    recommendation1: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    recommendation2: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    partnerInclusion?: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    } | undefined;
    partnerUsername?: string | undefined;
    partnerPassword?: string | undefined;
}, {
    inclusion: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    };
    applicantJobInfo: string;
    recommendation1: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    recommendation2: {
        subCodeInserted: string;
        namesAndLastNamesInserted: string;
    };
    partnerInclusion?: {
        newMemberDocumentType: "DNI" | "CE" | "PASSPORT";
        newMemberDocumentId: string;
        newMemberName: string;
        newMemberLastName: string;
        newMemberAddress: string;
        newMemberEmail: string;
        newMemberPhone: string;
        newMemberBirthDate: Date;
    } | undefined;
    partnerUsername?: string | undefined;
    partnerPassword?: string | undefined;
}>;
export type CreateMembershipApplicationDto = z.infer<typeof createMembershipApplicationSchema>;
