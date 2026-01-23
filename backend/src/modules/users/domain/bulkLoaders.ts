// application/bulkLoaders.ts
import { db } from '../../../db'; // tu instancia de Drizzle
import { membership } from '../../../db/schema/Membership';
import { eq } from 'drizzle-orm';
import { parse, isValid, format, differenceInYears } from 'date-fns';
import { membershipState, type MembershipState } from '../../../shared/enums/MembershipState';
import { memberType } from '../../../db/schema/MemberType';
import { membershipXMember } from '../../../db/schema/MembershipXMember';
import { member } from '../../../db/schema/Member';
import { auth } from '../../../db/schema/Auth';
import { user } from '../../../db/schema/User';
import type { Gender } from '../../../shared/enums/Gender';
import { AuthService } from '../../auth/application/AuthService';
import { plantillasCorreo } from '../../notifications/domain/notification_templates';
import { enviarCorreo } from '../../notifications/application/notifications_service';
import { Account } from '../../auth/domain/Account';
import { getMemberTypeByNameContaining } from '../../membership/application/member_type_service';

// 1) Definimos un mapeo rápido
const genderMap: Record<string, Gender> = {
  'M':     'MALE',
  'F':     'FEMALE',
  'Otro':  'OTHER',
};

export interface RawMembership { code: string; state: string; endDate?: string | Date }
export interface RawMember {
    email: string; firstName: string; lastName: string;
    documentType: string; documentNumber: string; phone: string;
    birthDate: string | Date; gender: string; address?: string;
    role: string; membershipCode: string; memberSubCode?: string;
}

export interface BulkLoadResult {
    warnings: string[];
}

export async function loadMembershipsAndMembers(
    rawMemberships: RawMembership[],
    rawMembers: RawMember[]
): Promise<BulkLoadResult> {
    const warnings: string[] = [];
    const emailsToSend: { to: string; password: string }[] = [];

    await db.transaction(async (tx) => {
        // 1) Cargar y validar memberships
         // Ahora guardamos finalEnd como Date|undefined
    const codeMap: Record<string, { id: number; finalEnd?: Date }> = {};
        for (let i = 0; i < rawMemberships.length; i++) {
            const rowNum = i + 2;
            const { code, state, endDate } = rawMemberships[i]!;
            if (!code.trim()) throw new Error(`Membresía fila ${rowNum}: código vacío`);
            if (code.length > 255) warnings.push(`Membresía fila ${rowNum}: código truncado`);
            const finalCode = code.trim().slice(0, 255);

            let finalState: MembershipState;
            if (state === 'ACTIVE') {
                finalState = membershipState[1];
                if (endDate) warnings.push(`Membresía fila ${rowNum}: endDate ignorada para ACTIVE`);
            } else if (state === 'ENDED') {
                finalState = membershipState[0];
            } else {
                throw new Error(`Membresía fila ${rowNum}: estado inválido “${state}”`);
            }

             // Parseamos finalEnd SOLO si es ENDED
      let parsedEnd: Date | undefined;
      if (finalState === membershipState[0]) {
        if (endDate == null || (typeof endDate === 'string' && !endDate.trim())) {
          warnings.push(
            `Fila ${rowNum}: endDate faltante para ENDED → hoy`,
          );
          parsedEnd = new Date();
        } else if (typeof endDate !== 'string') {
          parsedEnd =
            endDate instanceof Date ? endDate : new Date(endDate as any);
          if (!isValid(parsedEnd)) {
            throw new Error(
              `Fila ${rowNum}: endDate no válido (“${endDate}”)`,
            );
          }
        } else {
          const dt = parse(endDate, 'dd/MM/yyyy', new Date());
          if (!isValid(dt)) {
            throw new Error(
              `Fila ${rowNum}: fecha inválida (“${endDate}”)`,
            );
          }
          parsedEnd = dt;
        }
      }

            const [ins] = await tx
                .insert(membership)
                .values({ code: finalCode, state: finalState })
                .$returningId();
            if (!ins) throw new Error(`Membresía fila ${rowNum} no insertada`);

            // Guardamos parsedEnd (undefined si ACTIVE)
      codeMap[finalCode] = { id: ins.id, finalEnd: parsedEnd };
        }

        // 2) Cargar y validar members + relaciones
        for (let j = 0; j < rawMembers.length; j++) {
            const rowNum = j + 2;
            const m = rawMembers[j]!;

            // Validaciones
            if (!m.email.includes('@')) throw new Error(`Miembro fila ${rowNum}: email inválido`);
            if (!m.firstName.trim() || m.firstName.length > 100) throw new Error(`Miembro fila ${rowNum}: nombre inválido`);
            if (!m.lastName.trim() || m.lastName.length > 100) throw new Error(`Miembro fila ${rowNum}: apellido inválido`);

            const docTypes = ['DNI', 'CE', 'PASSPORT'];
            if (!docTypes.includes(m.documentType)) throw new Error(`Miembro fila ${rowNum}: tipo doc inválido`);

            if (!m.documentNumber.trim() || m.documentNumber.length > 50) throw new Error(`Miembro fila ${rowNum}: nro doc inválido`);

            if (!m.phone.trim() || m.phone.length > 50) throw new Error(`Miembro fila ${rowNum}: teléfono inválido`);

            // 1) Normalizamos a Date: si ya es Date, lo usamos; si es string, lo parseamos
            let bd: Date;
            if (m.birthDate instanceof Date) {
            bd = m.birthDate;
            } else {
            // asumo formato "dd/MM/yyyy"
            bd = parse(m.birthDate, 'dd/MM/yyyy', new Date());
            }

            // 2) Validamos
            if (!isValid(bd)) {
            throw new Error(
                `Miembro fila ${rowNum}: fecha inválida (“${m.birthDate}”), debe ser dd/MM/yyyy o un Date válido`
            );
            }
            if (differenceInYears(new Date(), bd) < 18) {
            throw new Error(`Miembro fila ${rowNum}: menor de 18 años`);
            }

            const rawG = m.gender.trim();
let genderForDb: Gender | undefined = genderMap[rawG];
if (!genderForDb) {
  warnings.push(`Miembro fila ${rowNum}: género “${rawG}” desconocido, se guardará como OTHER`);
  genderForDb = 'OTHER';
}

            // const roles = ['TITULAR', 'CÓNYUGUE', 'HIJO', 'PRIMO'];
            const memberTypeRetrieved = await getMemberTypeByNameContaining(m.role);
            if(! memberTypeRetrieved ){
                throw new Error(`Miembro fila ${rowNum}: rol inválido`);
            }
            // buscamos la membresía en el map
      const memInfo = codeMap[m.membershipCode];
      if (!memInfo) {
        throw new Error(
          `Miembro fila ${rowNum}: membershipCode desconocido`,
        );
      }

            if (!m.memberSubCode) {
                warnings.push(`Miembro fila ${rowNum}: subCode auto-generado`);
                m.memberSubCode = `${m.membershipCode}-${j + 1}`;
            }
            const pass = crypto.randomUUID();
            // 2.1 Insert Auth
            const [a] = await tx
                .insert(auth)
                .values({
                    email: m.email,
                    username: m.email,
                    password:   (await Bun.password.hash( pass)).toString(),
                    role: 'MEMBER',
                    isActive: true,
                    googleId: null,
                    oauthProvider: null,
                })
                .$returningId();
            if (!a) throw new Error(`Miembro fila ${rowNum}: auth no creado`);


            // 2.2 Insert User
            const userInsertRecords = [{
                lastname: m.lastName,
                name: m.firstName,
                documentType: m.documentType,
                documentID: m.documentNumber,
                phoneNumber: m.phone,
                birthDate: bd,           // Date
                gender: m.gender,
                address: m.address,
                profilePictureURL: null,
                accountID: a.id,
            }] as typeof user.$inferInsert[];

            // 2.2 Insert User

            const [u] = await tx
                .insert(user)
                .values(userInsertRecords)
                .$returningId();
            if (!u) throw new Error(`Miembro fila ${rowNum}: user no creado`);

            // 2.3 Insert Member
            // const mt = await tx
            //     .select({ id: memberType.id })
            //     .from(memberType)
            //     .where(eq(memberType.name, m.role))
            //     .then(r => r[0]);
            // if (!mt) throw new Error(`Miembro fila ${rowNum}: memberType "${m.role}" no existe`);

            await tx.insert(member).values({
                id: u.id,
                subCode: m.memberSubCode,
                isActive: true,
                memberTypeId: memberTypeRetrieved.id,
            });

            // 2.4 Relación membership_x_member
           // Usamos memInfo.finalEnd: si existe, la inserto, sino NULL
      const mxmDto = {
        membershipId: memInfo.id,
        memberId:     u.id,
        startDate:    new Date(),
        endDate:      memInfo.finalEnd ?? null,
        reasonToEnd:  memInfo.finalEnd ? 'TERMINATION' : null,
      } as typeof membershipXMember.$inferInsert;
            // 2.4 Relacion membership_x_member
            await tx
        .insert(membershipXMember)
        .values(mxmDto);
        // Acumulo para enviar el mail **fuera** de la tx:
    emailsToSend.push({ to: m.email, password: pass });
        // // const authcito = await authService.findByEmail(m.email);
        // const token = await authService.createResetToken(authcito);
        //       if (!token) {
        //         throw new Error("Failed to create reset token");
        //       }
        
        //       if (!plantillasCorreo.recuperarContrasena) {
        //         throw new Error("RecuperarContrasena template is not defined");
        //       }
        //       const { subject, message } = plantillasCorreo.recuperarContrasena({
        //         nombre: authcito.username ?? "usuario", // Usa nombre si existe, si no, fallback
        //         extra: { token },
        //       });
        // NO PUDE HACERLO CON EL FORGOT PASSWORD YA HECHO PORQUE ESTO ES UNA TRANSACCIÓN Y ESO ESTÁ MUY ACOPLADO AL REGISTRO COMO TAL DE UN AUTH, LO QUE DA ERROR 
              // Enviar correo
            //   await enviarCorreo({
            //     to: authcito.email,
            //     subject:"¡Bienvenido al nuevo sistema del club!",
            //     message:"Has sido añadido como miembro al club, puede acceder al sistema con su correo y su contraseña (se recomienda cambiarla inmediatamente): \n"+pass ,
            //   });

        }
    });

    // 2) ¡La tx ya está confirmada! Ahora envío los correos
  for (const { to, password } of emailsToSend) {
    try {
      await enviarCorreo({
        to,
        subject: "¡Bienvenido al nuevo sistema del club!",
        message: `Puedes acceder ya al sistema con tu correo. Tu contraseña temporal es: \n${password}`,
      });
    } catch (err: any) {
      warnings.push(`Error enviando a ${to}: ${err.message}`);
      console.warn(`SMTP fallo para ${to}`, err);
    }
  }

    return { warnings };
}