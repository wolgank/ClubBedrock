import type { DocumentType } from "../../../shared/enums/DocumentType";
import type { Gender } from "../../../shared/enums/Gender";
export declare class User {
    readonly id: number;
    lastname: string;
    name: string;
    documentType: DocumentType;
    documentID: string;
    readonly accountID: number;
    phoneNumber?: string | undefined;
    birthDate?: Date | undefined;
    gender?: Gender | undefined;
    address?: string | undefined;
    profilePictureURL?: string | undefined;
    constructor(id: number, lastname: string, name: string, documentType: DocumentType, documentID: string, accountID: number, phoneNumber?: string | undefined, birthDate?: Date | undefined, gender?: Gender | undefined, address?: string | undefined, profilePictureURL?: string | undefined);
}
