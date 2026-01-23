// controllers/membership_change_controller.ts
import type { Context } from 'hono';
import * as membership_change_service from '../../application/membership_change_service';


// POST /membership-change-requests/suspend
export const sendSuspensionRequestByMember = async (c: Context) => {
  const body = await c.req.json();
  try {
    const created = await membership_change_service.sendSuspensionRequestByMember(body);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

// POST /membership-change-requests/disaffiliate
export const sendAnulationRequestByMember = async (c: Context) => {
  const body = await c.req.json();
  try {
    const created = await membership_change_service.sendDisaffiliationRequestByMember(body);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};
/** Devuelve todas las solicitudes de cambio de membresía */
  export const getAllChangeRequests = async (c: Context) => {
    try {
      const list = await membership_change_service.getAllChangeRequests();
      return c.json(list);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  };

  export const getChangeRequestDetail = async (c: Context) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID inválido" }, 400);
  }
  try {
    const detail = await membership_change_service.getChangeRequestDetailById(id);
    return c.json(detail);
  } catch (err: any) {
    return c.json(
      { error: err.message },
      err.message === "ChangeRequest no encontrada" ? 404 : 500
    );
  }
};

// POST /:id/approve
export const approveChangeRequestByManager = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const { managerNotes } = await c.req.json();
  try {
    const res = await membership_change_service.approveChangeRequest(id, managerNotes);
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
};

// POST /:id/reject
export const rejectChangeRequestByManager = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const { managerNotes } = await c.req.json();
  try {
    const res = await membership_change_service.rejectChangeRequest(id,managerNotes);
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
};
/**
 * Handler para que el responsable cree y apruebe un cambio de membresía
 * POST /membership-change-requests/manager
 */
export const managerCreate = async (c: Context) => {
  const body = await c.req.json();
  try {
    const created = await membership_change_service.createAndApproveChangeRequestByManager(body);
    return c.json(created, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

export const listMemberInitiated = async (c: Context) => {
  try {
    const list = await membership_change_service.getMemberChangeRequests();
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

export const listAll = async (c: Context) => {
  try {
    const list = await membership_change_service.getAllMemberChangeRequests();
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};


export const reactivateSuspended = async (c: Context) => {
  const membershipId = Number(c.req.param('membershipId'))
  if (isNaN(membershipId)) {
    return c.json({ error: 'Invalid membershipId' }, 400)
  }
  try {
    const result = await membership_change_service.reactivateSuspendedMembers(membershipId)
    return c.json(result, 200)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
}


  export const getMyChangeRequests = async (c: Context) => {
    const jwtPayload = c.get("account");
    if (!jwtPayload?.sub) {
     return c.json({ error: 'No autenticado correctamente' }, 401);
    }

    try {
      const list = await membership_change_service.getOwnChangeRequests(jwtPayload.sub);
      return c.json(list);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  };

  export async function reactivateMembershipHandler(c: Context) {
  const membershipId = Number(c.req.param('id'));
  if (isNaN(membershipId)) {
    return c.json({ error: 'ID inválido' }, 400);
  }

  try {
    await membership_change_service.reactivateMembership(membershipId);
    return c.json({ message: 'Membresía reactivada' }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
}


