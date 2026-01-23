// routes/membership_routes.ts
import { Hono } from "hono";
import * as membershipChangeController from "../controllers/membership_change_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
const membershipChangeRouter = new Hono()


.post(
  '/membership/:id/reactivate',
  authMiddleware,
  membershipChangeController.reactivateMembershipHandler
)
.get(
    "/my-change-requests",
    authMiddleware,
    membershipChangeController.getMyChangeRequests
  )
  // Rutas estáticas primero
  .post(
    "/suspendByMember",
    authMiddleware,
    membershipChangeController.sendSuspensionRequestByMember
  )
  .post(
    "/disaffiliateByMember",
    authMiddleware,
    membershipChangeController.sendAnulationRequestByMember
  )

  .get("/", authMiddleware, membershipChangeController.getAllChangeRequests)

  .post(
    "/managerRequest",
    authMiddleware,
    membershipChangeController.managerCreate
  )
  .get(
    "/member-initiated",
    authMiddleware,
    membershipChangeController.listMemberInitiated
  )
  .get(
    "/all",
    authMiddleware,
    membershipChangeController.listAll
  )

  // Rutas con parámetro dinámico al final
  .get(
    "/:id",
    authMiddleware,
    membershipChangeController.getChangeRequestDetail
  )
  .post(
    "/:id/approve",
    authMiddleware,
    membershipChangeController.approveChangeRequestByManager
  )
  .post(
    "/:id/reject",
    authMiddleware,
    membershipChangeController.rejectChangeRequestByManager
  )
  // Reactivar todos los miembros suspendidos de una membresía
.post(
  '/:membershipId/reactivate',
  authMiddleware,
  membershipChangeController.reactivateSuspended
);

export default membershipChangeRouter;
