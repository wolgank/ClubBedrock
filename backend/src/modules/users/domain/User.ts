import type { DocumentType } from "../../../shared/enums/DocumentType";
import type { Gender } from "../../../shared/enums/Gender";

export class User {
  constructor(
    public readonly id: number,
    public lastname: string,
    public name: string,
    public documentType: DocumentType,
    public documentID: string,
    public readonly accountID: number,
    public phoneNumber?: string,
    public birthDate?: Date,
    public gender?: Gender,
    public address?: string,
    public profilePictureURL?: string,
  ) {}
}
