type MemberType = "TITULAR" | "CÓNYUGUE" | "HIJO/A" | "PADRE/MADRE" | "HERMANO/A" | "OTRO";
type DocumentType = "DNI" | "CE" | "PAS";

export type Member = {
    id: number,
    imageUrl?: string,
    name: string,
    lastname: string,
    memberType: MemberType
}


export type Outsider = {
    id: string,
    documentType?: DocumentType,
    documentId?: string,
    name: string,
    lastName: string
}