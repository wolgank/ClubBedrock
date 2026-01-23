// application/membership_application_service.ts
import { db } from "../../../db";
import { sql, desc, eq, like,not ,or,and, type ExtractTablesWithRelations, inArray,  } from "drizzle-orm";
import { user } from '../../../db/schema/User';
import { userInsertSchema } from "../../../db/schema/User";
import { memberInsertSchema } from "../../../db/schema/Member";
import { membershipState } from "../../../shared/enums/MembershipState";
import {formatMembershipCode, formatMemberSubCode} from "../../../shared/utils/formatMembershipCode";
import {addOneMonth} from "../../../shared/utils/dayUtils";

import {
  memberRequest,
} from "../../../db/schema/MemberRequest";
import {
  memberInclusionRequest,
} from "../../../db/schema/MemberInclusionRequest";
import {
  recomendationMember,
} from "../../../db/schema/RecommendationMember";
import {
  membershipApplication,
} from "../../../db/schema/MembershipApplication";

import type {
  CreateMembershipApplicationDto,
} from "../dto/CreateMembershipApplicationDto";
import { requestState } from "../../../shared/enums/RequestState";
import { role } from "../../../shared/enums/Role";
import { memberType } from "../../../db/schema/MemberType";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import type { MySql2QueryResultHKT, MySql2PreparedQueryHKT } from "drizzle-orm/mysql2";
import { member } from "../../../db/schema/Member";
import { membership, membershipInsertSchema } from "../../../db/schema/Membership";
import { membershipXMember, membershipXMemberInsertSchema } from "../../../db/schema/MembershipXMember";
import * as membership_application_repository from "../infrastructure//repositories/membership_application_repository";
import * as member_inclusion_request_repository from "../infrastructure//repositories/member_inclusion_request_repository";
import * as member_request_repository from "../infrastructure//repositories/member_request_repository";
import * as recommendation_member_repository from "../infrastructure//repositories/recommendation_member_repository";
import { auth } from "../../../db/schema/Auth";
import { AuthService } from "../../auth/application/AuthService";

import {
  createMemberRequest,
  findMemberType,
  addInclusion,
  addRecommendation,
  addApplicationRecord,
  createMembershipRecord,
  assignMembershipToMember,
  insertMemberFromUser,
} from "./membership_application_helpers"; // tus helpers previos
import { upsertUserFromInclusion } from "./membership_application_helpers"; // el helper de upsert
import { bill } from "../../../db/schema/Bill";
import { billDetail } from "../../../db/schema/BillDetail";
import { debtStatus } from "../../../shared/enums/DebtStatus";
import { generateMembershipFeeTicketFromMembership } from "./membership_fee_ticket_service";
import { recalculateBillAmount } from "../../payment/application/bill_service";
import { plantillasCorreo } from "../../notifications/domain/notification_templates";
import { enviarCorreo } from "../../notifications/application/notifications_service";
import { text } from "drizzle-orm/gel-core";
//import { addOneMonth } from "../../../shared/utils/dayUtils";

export const createMembershipApplication = async (
  dto: CreateMembershipApplicationDto & { accountID: number }
) => {
  return await db.transaction(async (tx) => {
    // 1) Solicitud principal
    const mainReqId = await createMemberRequest(
      tx,
      "Nueva solicitud de membresía"
    );

    // 2) Buscamos el tipo TITULAR y añadimos la inclusión
    const titularType = await findMemberType(tx, "TITULAR");
    await addInclusion(tx, mainReqId, dto.inclusion, titularType.id);

    // 3) Partner (si aplica)
    let partnerReqId: number | null = null;
    if (dto.partnerInclusion) {
      partnerReqId = await createMemberRequest(
        tx,
        "Solicitud de cónyuge adjunta"
      );
      const spouseType = await findMemberType(tx, "CÓNYUGUE");
      await addInclusion(tx, partnerReqId, dto.partnerInclusion, spouseType.id);
      var partnerAccount = undefined;
      if(!dto.partnerPassword){
          throw new Error("La contraseña debe estar si se colocan datos del cónyugue. (PAM HARDCODEA LA password y el username o pon para que los ingrese el usuario)");
      }else{
        const a = new AuthService;
        const authcito = {
          email:    dto.partnerInclusion.newMemberEmail,
          password: dto.partnerPassword!,    // ya es string
          role:     role[2],
          username: dto.partnerUsername!,    // ya es string
        }
        const usercito = {
          lastname: "apellido",
          name: "nombre",
          documentType: undefined,
          documentID: undefined,
          phoneNumber: undefined,
          birthDate: undefined,
          gender: undefined,
          address: undefined,
          profilePictureURL: undefined,
          accountID: 0,
          accountId: undefined,

        }

        const authData = {
auth:authcito, user:usercito
          
        };
        partnerAccount = await a.register(authData);
        //lógica por si en otra ocasión vuelve a poner a la esposa...

      }

      await upsertUserFromInclusion(tx, partnerAccount.account.id, dto.partnerInclusion); //todo desde el auth, por ahora, no del user
    }

    await upsertUserFromInclusion(tx, dto.accountID,dto.inclusion )
    // 4) Recomendaciones
    const rec1Id = await addRecommendation(tx, dto.recommendation1);
    const rec2Id = await addRecommendation(tx, dto.recommendation2);

    // 5) Registro final de la aplicación
    await addApplicationRecord(
      tx,
      mainReqId,
      partnerReqId,
      rec1Id,
      rec2Id,
      { applicantJobInfo: dto.applicantJobInfo, accountID: dto.accountID, accountPosiblyPartnerID: partnerAccount?.account.id   }
    );

    // 6) Recuperar y devolver sólo el id y estado
    const [app] = await tx
      .select({
        id: membershipApplication.id,
        idPosiblyPartner: membershipApplication.idPosiblyPartner,
        applicantJobInfo: membershipApplication.applicantJobInfo,
        accountID: membershipApplication.accountID,
        idRecommendationMember1:
          membershipApplication.idRecommendationMember1,
        idRecommendationMember2:
          membershipApplication.idRecommendationMember2,
      })
      .from(membershipApplication)
      .where(eq(membershipApplication.id, mainReqId));

    return app;
  });
};

export type MembershipRequestSummary = {
  id: number;
 // idMembershipApplication: number;
  applicantName: string;
  applicantLastName: string;
  submissionDate: Date | null;
  requestState: string | null;
  validRecommendations: number;
};

/**
 * Devuelve un resumen de las solicitudes de membresía, con:
 * - nombre y apellido del solicitante (de memberInclusionRequest)
 * - fecha de envío y estado (de memberRequest)
 * - cuántas de las dos recomendaciones tienen memberId no nulo
 * Ordenado por fecha de envío descendente.
 */
export const getMembershipApplications = async (): Promise<MembershipRequestSummary[]> => {
  return await db
    .select({
      id: memberRequest.id,//esto es lo mismo que el membershipApplication.id, ya que la application agarra 2 ids, del request titular y del request conyugue si hubiera como atributos
     //idMembershipApplication: membershipApplication.id,
      applicantName:     user.name,
      applicantLastName: user.lastname,
      submissionDate: memberRequest.submissionDate,
      requestState: memberRequest.requestState,
      // Subquery que suma dos CASEs para contar recomendaciones con memberId no nulo
      validRecommendations: sql<number>`
        (
          SELECT
            (CASE WHEN rm1.member_id IS NOT NULL THEN 1 ELSE 0 END) 
          + (CASE WHEN rm2.member_id IS NOT NULL THEN 1 ELSE 0 END)
          FROM membership_aplk AS ma
          LEFT JOIN rec_member AS rm1
            ON ma.idRecommendationMember1 = rm1.id
          LEFT JOIN rec_member AS rm2
            ON ma.idRecommendationMember2 = rm2.id
          WHERE ma.id = ${memberRequest.id}
        )
      `,
    })
    .from(membershipApplication)
    .innerJoin(memberRequest, eq(memberRequest.id, membershipApplication.id))
    .innerJoin(user, eq(user.accountID, membershipApplication.accountID))
    .orderBy(desc(memberRequest.submissionDate));
};

export type RecommendationSummary = {
  subCodeInserted: string;
  namesAndLastNamesInserted: string;
};

export type PersonInfo = {
  documentType: string | null;
  documentId: string | null;
  fullName: string;
  birthDate: Date | null;
};

export type ContactInfo = {
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type DetailedMembershipApplication = {
  applicationId: number;
  requestDate: Date | null;
  applicant: PersonInfo;
  contact: ContactInfo;
  jobInfo: string;
  recommendations: RecommendationSummary[];
  partner?: {
    info: PersonInfo;
    contact: ContactInfo;
  };
};

export const getDetailedMembershipApplicationById = async (
  id: number
): Promise<DetailedMembershipApplication> => {
  // 1) Recuperar la fila de membershipApplication + requestDate + applicant user + auth
  const [row] = await db
    .select({
      applicationId:       membershipApplication.id,
      requestDate:         memberRequest.submissionDate,
      jobInfo:             membershipApplication.applicantJobInfo,
      // applicant user fields
      docType:             user.documentType,
      docId:               user.documentID,
      name:                user.name,
      lastname:            user.lastname,
      birthDate:           user.birthDate,
      email:               auth.email,
      phone:               user.phoneNumber,
      address:             user.address,
      rec1Id:             membershipApplication.idRecommendationMember1,
      rec2Id:             membershipApplication.idRecommendationMember2,
      partnerAccountId:    membershipApplication.accountPosiblyPartnerID,
    })
    .from(membershipApplication)
    .innerJoin(memberRequest, eq(memberRequest.id, membershipApplication.id))
    .innerJoin(user,          eq(user.accountID, membershipApplication.accountID))
    .innerJoin(auth,          eq(auth.id,       membershipApplication.accountID))
    .where(eq(membershipApplication.id, id));

  if (!row) {
    throw new Error("Solicitud no encontrada");
  }

  // Build person/contact for applicant
  const applicant: PersonInfo = {
    documentType: row.docType,
    documentId:   row.docId,
    fullName:     `${row.name} ${row.lastname}`,
    birthDate:    row.birthDate,
  };
  const contact: ContactInfo = {
    email:   row.email,
    phone:   row.phone,
    address: row.address,
  };

  // 2) Recomendaciones
  const recs = await db
    .select({
      subCodeInserted:           recomendationMember.subCodeInserted,
      namesAndLastNamesInserted: recomendationMember.namesAndLastNamesInserted,
    })
    .from(recomendationMember)
    .where(
      or(
      eq(recomendationMember.id, row.rec1Id),
      eq(recomendationMember.id, row.rec2Id)
      )
    );

  // 3) Partner (si existe)
  let partner;
  if (row.partnerAccountId) {
    // recuperamos partner user/contact
    const [p] = await db
      .select({
        docType:   user.documentType,
        docId:     user.documentID,
        name:      user.name,
        lastname:  user.lastname,
        birthDate: user.birthDate,
        email:     auth.email,
        phone:     user.phoneNumber,
        address:   user.address,
      })
      .from(user)
      .innerJoin(auth, eq(auth.id, row.partnerAccountId))
      .where(eq(user.accountID, row.partnerAccountId));

    if (!p) {
      throw new Error("Datos de cónyuge no encontrados");
    }

    partner = {
      info: {
        documentType: p.docType,
        documentId:   p.docId,
        fullName:     `${p.name} ${p.lastname}`,
        birthDate:    p.birthDate,
      },
      contact: {
        email:   p.email,
        phone:   p.phone,
        address: p.address,
      },
    };
  }

  return {
    applicationId: row.applicationId,
    requestDate:   row.requestDate,
    applicant,
    contact,
    jobInfo:       row.jobInfo,
    recommendations: recs.map(r => ({
      subCodeInserted:           r.subCodeInserted,
      namesAndLastNamesInserted: r.namesAndLastNamesInserted,
    })),
    ...(partner ? { partner } : {}),
  };
};

/**
 * Aprueba una MembershipApplication:
 * - Actualiza estado de member_request (padre y partner si existe)
 * - Inserta usuario(s) basados en inclusionRequest
 * - Crea member(s) para esos usuarios
 */
export const approveMembershipApplication = async (
  applicationId: number
) => {
  return await db.transaction(async (tx) => {
    // 1) Obtener aplicación
    const [app] = await tx
      .select()
      .from(membershipApplication)
      .where(eq(membershipApplication.id, applicationId));
    if (!app) throw new Error("Application no encontrada");

    const { id: reqId, idPosiblyPartner, accountID } = app;

    // 2) Obtener inclusiones
    const [incMain] = await tx
      .select()
      .from(memberInclusionRequest)
      .where(eq(memberInclusionRequest.id, reqId));
    if (!incMain) throw new Error("Inclusion principal no encontrada");

    let incPartner;
    if (idPosiblyPartner) {
      const row = await tx
        .select()
        .from(memberInclusionRequest)
        .where(eq(memberInclusionRequest.id, idPosiblyPartner));
      incPartner = row[0];
      if (!incPartner) throw new Error("Inclusion partner no encontrada");
    }

// Actualizar estado(s) a APPROVED (índice 2)
    await tx
      .update(memberRequest)
      .set({ requestState: requestState[2] }) // APPROVED
      .where(eq(memberRequest.id, reqId));
    if (idPosiblyPartner) {
      await tx
        .update(memberRequest)
        .set({ requestState: requestState[2] })
        .where(eq(memberRequest.id, idPosiblyPartner));
    }

    // Crear membership y asignar a miembros
    const { membershipId, code: membershipCode } = await createMembershipRecord(tx);
     //cambiar al auth a MEMBER oficialmente
    await tx
      .update(auth)
      .set({ role: role[1] })
      .where(eq(auth.id, accountID));
      
   // 5) Obtener userId del TITULAR
    const [userMain] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.accountID, accountID));
    if (!userMain) throw new Error("User titular no encontrado");

    // 6) Insertar miembro y asignar membresía
    await insertMemberFromUser(tx, userMain.id, incMain.newMemberType, membershipCode, 1); // me pasé, por qué puse 1 ahí xdd me fregó
    await assignMembershipToMember(tx, userMain.id, membershipId);

    if (incPartner && app.accountPosiblyPartnerID) {
      const [userPartner] = await tx
        .select({ id: user.id, accountPartnerID: user.accountID })
        .from(user)
        .where(eq(user.accountID, app.accountPosiblyPartnerID));
      if (!userPartner) throw new Error("User cónyuge no encontrado");

      await tx
      .update(auth)
      .set({ role: role[1] })
      .where(eq(auth.id, app.accountPosiblyPartnerID));

      await insertMemberFromUser(tx, userPartner.id, incPartner.newMemberType, membershipCode, 2);
      await assignMembershipToMember(tx, userPartner.id, membershipId);
    }
// CUOTA DE INGRESO:
// 4) Crear Bill para el titular
    //    4.1) Obtener costo de inclusión
    const [mt] = await tx
      .select({ cost: memberType.inclusionCost })
      .from(memberType)
      .where(eq(memberType.id, incMain.newMemberType));
    if (!mt) throw new Error("MemberType no encontrado");

    const [usr] = await tx
  .select({ id: user.id, authId: user.accountID, nom:user.name, ap:user.lastname })
  .from(user)
  .where(eq(user.accountID, accountID));
if (!usr) throw new Error("User titular no encontrado");

    const now = new Date();
    const isoNow = now.toISOString();  // para createdAt/dueDate como string
    const billDto = {
      finalAmount: String(mt.cost.toFixed(2)),
      status:      debtStatus[0],
      description: "CUOTA DE INGRESO",
      createdAt:   now,

      dueDate:     addOneMonth(now),

      userId:      usr.id,
    };

    // 4.4) Insertar la Bill
const [billRec] = await tx.insert(bill).values(billDto).$returningId();
if (!billRec) throw new Error("No se creó la Bill");

    // 6) Crear BillDetail
    const bdDto = {
      billId:     billRec.id,
      price:      mt.cost.toFixed(2),
      discount:   "0.00",
      finalPrice: mt.cost.toFixed(2),
      description:"CUOTA DE INGRESO",
    };
    const [bdRec] = await tx.insert(billDetail).values(bdDto).$returningId();
    if (!bdRec) throw new Error("No se creó la BillDetail");

    // 7) Actualizar memberRequest principal con idBillDetail
    await tx
      .update(memberRequest)
      .set({ idBillDetail: bdRec.id })
      .where(eq(memberRequest.id, reqId));

// 6b) Si hay cónyuge, crear su línea de detalle y actualizar su memberRequest
    if (idPosiblyPartner) {
      // 6b.1) Obtener costo de inclusión del tipo CÓNYUGUE
      const [mtSpouse] = await tx
        .select({ cost: memberType.inclusionCost })
        .from(memberType)
        .where(eq(memberType.id, incPartner!.newMemberType));
      if (!mtSpouse) throw new Error("MemberType de cónyuge no encontrado");

      // 6b.2) Insertar segundo detalle en la misma Bill
      const spouseDetailDto = {
        billId:     billRec.id,
        price:      mtSpouse.cost.toFixed(2),
        discount:   '0',
        finalPrice: mtSpouse.cost.toFixed(2),
        description:"PARTE DE LA CUOTA DE INGRESO DEL CÓNYUGUE",
      };
      const [spouseDetailRec] = await tx
        .insert(billDetail)
        .values(spouseDetailDto)
        .$returningId();
      if (!spouseDetailRec) throw new Error("No se creó BillDetail del cónyuge");

      // 6b.3) Actualizar memberRequest del cónyuge con su idBillDetail
      await tx
        .update(memberRequest)
        .set({ idBillDetail: spouseDetailRec.id })
        .where(eq(memberRequest.id, idPosiblyPartner));

        await recalculateBillAmount(tx, billRec.id);
    }
    
    await generateMembershipFeeTicketFromMembership(tx,membershipId); //bastará con esto pa que funque?

    // const [authcito] = await tx.select({correo: auth.email}).from(auth).where(eq(auth.id,usr.authId));
    // const { subject, message } = plantillasCorreo["solicitudMembresiaAprobada"]!({nombre: usr.nom  });
    // await enviarCorreo({ to: authcito?.correo!, subject, message });

    return { applicationId, membershipId };
  });
};


/** Paso A: actualiza una MemberRequest a REJECTED */
async function markRequestRejected(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  requestId: number
): Promise<void> {
  await tx
    .update(memberRequest)
    .set({ requestState: requestState[1] /* REJECTED */ })
    .where(eq(memberRequest.id, requestId));
}

/**
 * Rechaza una MembershipApplication:
 * - Marca la solicitud principal y, si existe, la del cónyuge, como REJECTED
 */
export const rejectMembershipApplication = async (
  applicationId: number
): Promise<{ applicationId: number }> => {
  return await db.transaction(async (tx) => {
    // 1) Leer la aplicación
    const [app] = await tx
      .select()
      .from(membershipApplication)
      .where(eq(membershipApplication.id, applicationId));
    if (!app) throw new Error("Application no encontrada");

    const { id: reqId, idPosiblyPartner } = app;

    // 2) Rechazar la solicitud principal
    await markRequestRejected(tx, reqId);

    // 3) Rechazar la del cónyuge si existe
    if (idPosiblyPartner) {
      await markRequestRejected(tx, idPosiblyPartner);
    }

    return { applicationId };
  });
};

/**
 * Verifica si el usuario con accountID tiene alguna solicitud de membresía
 * con al menos una inclusión NO rechazada.
 *
 * - Si no hay aplicaciones, devuelve false.
 * - Para cada aplicación existente, toma sus `id` y `idPosiblyPartner`,
 *   y comprueba en memberRequest si alguno está EN PENDING o APPROVED.
 * - Si encuentra al menos uno en estado distinto de REJECTED, devuelve true.
 * - Si todos están REJECTED, devuelve false.
 */
export const hasExistingMembershipApplication = async (
  accountID: number
): Promise<boolean> => {
  // 1) Traer todas las aplicaciones de este usuario
  const apps = await db
    .select({
      reqId:       membershipApplication.id,
      partnerReqId: membershipApplication.idPosiblyPartner,
    })
    .from(membershipApplication)
    .where(eq(membershipApplication.accountID, accountID));

  if (apps.length === 0) {
    // No existen aplicaciones
    return false;
  }

  // 2) Recopilar todos los IDs de memberRequest a verificar
  const requestIds = apps.flatMap((app) =>
    [app.reqId, app.partnerReqId].filter((id): id is number => typeof id === "number")
  );
  if (requestIds.length === 0) {
    // Aplicaciones sin inclusiones (improbable)
    return false;
  }

  // 3) Buscar si hay al menos un memberRequest cuyo estado NO sea REJECTED
  const [openReq] = await db
    .select({ id: memberRequest.id })
    .from(memberRequest)
    .where(
      and(
        inArray(memberRequest.id, requestIds),
        not( eq(memberRequest.requestState, "REJECTED") )
      )
    )
    .limit(1);

  // Si existe openReq, hay una inclusión pendiente o aprobada
  return !!openReq;
};




