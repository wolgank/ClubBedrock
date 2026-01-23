import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors';


import authrouter from './modules/auth/infrastructure/routes/AuthRoutes';

// MEMBERSHIP
import memberTypeRouter from './modules/membership/infrastructure/routes/member_type_routes'
import memberRequestRouter from './modules/membership/infrastructure/routes/member_request_routes'
import membershipApplicationRouter from './modules/membership/infrastructure/routes/membership_application_routes'
import membershipChangeRouter from './modules/membership/infrastructure/routes/membership_change_routes'
import memberRouter from "./modules/membership/infrastructure/routes/member_routes";

import membershipXMemberRouter from './modules/membership/infrastructure/routes/membership_x_member_routes';
// RESERVATIONS
import reservationInscriptionRouter from './modules/reservations/infrastructure/routes/reservation_inscription_routes';
import reservationRouterM  from './modules/reservations/infrastructure/routes/reservation_routes';
import spaceRouterM from './modules/reservations/infrastructure/routes/space_routes';
import spaceDayTimeSlotForMemberRouter from './modules/reservations/infrastructure/routes/spaceDayTimeSlotForMember_routes';

// EVENTS
import eventRouter from './modules/events/infrastructure/routes/event_routes';
import eventInscriptionRouter from './modules/events/infrastructure/routes/event_inscription_routes';

// ACADEMIES
import academyRouter from './modules/academies/infrastructure/routes/academy_routes';
import academyInscriptionRouter from './modules/academies/infrastructure/routes/academy_inscription_routes';
import academyCourseRouter from './modules/academies/infrastructure/routes/academy_course_routes';
import courseTimeSlotRouter from './modules/academies/infrastructure/routes/course_time_slot_routes';

//USERS
import userRouter from './modules/users/infrastructure/routes/user_routes';
import employeeRouter from './modules/users/infrastructure/routes/employee_routes';
import fileRoutes from './modules/files/infrastructure/routes/file_routes';

// PAYMENT
import billRouter from './modules/payment/infrastructure/routes/bill_routes'
import billDetailRouter from './modules/payment/infrastructure/routes/bill_detail_routes'
import inscription_x_user_Router from './modules/payment/infrastructure/routes/inscription_x_user_routes'
import reservationSpaceInscriptionRouter from './modules/payment/infrastructure/routes/reservation_space_inscription_routes';
import clubRouter from './modules/club/infrastructure/routes/ClubRoutes';
import memberAttachedDocumentRouter from './modules/membership/infrastructure/routes/member_attached_document_routes';
import notificationRouter from './modules/notifications/infrastructure/routes/notifications_routes';
import membershipRouter from './modules/membership/infrastructure/routes/membership_routes';
/***********************************************************************************************************************/

const app = new Hono()

app.use('*', logger())
app.use(
    '*',
    cors({
      origin: `${process.env.FRONTEND_URL}`, // aquí pones la URL de tu frontend
      credentials: true,
    })
  );

//  app.use('*', async (c, next) => {
//  await next();
//  c.header('Content-Security-Policy', "default-src 'self'");
//  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
// c.header('X-Content-Type-Options', 'nosniff');
//  c.header('X-Frame-Options', 'DENY');
//  c.header('X-XSS-Protection', '1; mode=block');
//});


app.route('/config', clubRouter)
app.route('/auth',authrouter);
app.route('/events', eventRouter);
app.route('/files', fileRoutes);
const api = app.basePath('/api')
api.route('/member-types', memberTypeRouter)
api.route('/member-requests', memberRequestRouter)
api.route('/membership-applications', membershipApplicationRouter)
api.route('/membership-change-requests', membershipChangeRouter)
api.route('/membership-members', membershipXMemberRouter)
api.route("/members", memberRouter)
api.route("/memberships", membershipRouter)
api.route('/users', userRouter)
api.route('/employees', employeeRouter)
api.route('/members', employeeRouter)
api.route('/member-attached-documents',memberAttachedDocumentRouter)
//api.route('/membershipXMember', membershipXMemberRouter);
// Payment
const apiBill = api.route('/bill', billRouter)
const apiBillDetail = api.route('/billDetail', billDetailRouter)
const apiInscriptionXUser = api.route('/inscriptionXUser', inscription_x_user_Router)
const apiReservationSpaceInscriptionUser = api.route('/reservationSpaceInscription', reservationSpaceInscriptionRouter)

// Reservations
const apiSpace = api.route('/space', spaceRouterM);
const apiReservation = api.route('/reservation', reservationRouterM);
const apiSpaceDayTimeSlotForMember = api.route('/spaceDayTimeSlotForMember', spaceDayTimeSlotForMemberRouter);
const apiReservationInscription = api.route('/reservationInscription', reservationInscriptionRouter);

// Eventos
const apiEvent = api.route('/event', eventRouter);
const apiEventInscription = api.route('/eventInscription', eventInscriptionRouter);

// MembershipXMember
const apiMembershipXMember = api.route('/membershipXMember', membershipXMemberRouter);

//Academies
const apiAcademy = api.route('/academy', academyRouter);
const apiAcademyCourse = api.route('/academyCourse', academyCourseRouter);
const apiAcademyInscription = api.route('/academyInscription', academyInscriptionRouter);
// Memberships
const apiMembershipApplications = api.route('/membership-applications', membershipApplicationRouter);
const apiMembershipOperations = api.route('/membership-change-requests', membershipChangeRouter);

// Usuarios
const apiMembers = api.route("/members", memberRouter);
const apiUsers = api.route('/users', userRouter);
const apiEmployees  = api.route('/employees', employeeRouter);

// Notifications
const apiNotifications = api.route('/notifications', notificationRouter);

/***********************************************************************************************************************/

export default app 
export type AppType = typeof app
// Reservations
export type ApiSpace = typeof apiSpace
export type ApiReservation = typeof apiReservation
export type ApiSpaceDayTimeSlotForMember = typeof apiSpaceDayTimeSlotForMember
export type ApiReservationInscription = typeof apiReservationInscription
// Payment
export type ApiBill = typeof apiBill
export type ApiBillDetail = typeof apiBillDetail
export type ApiInscriptionXUser = typeof apiInscriptionXUser
export type ApiReservationSpaceInscriptionUser = typeof apiReservationSpaceInscriptionUser
//Event
export type ApiEvent = typeof apiEvent
export type ApiEventInscription = typeof apiEventInscription
// MembershipXMember
export type ApiMembershipXMember = typeof apiMembershipXMember

//Memberships
export type ApiMembershipApplications = typeof apiMembershipApplications
export type ApiMembershipOperations = typeof apiMembershipOperations

//Users
export type ApiUsers = typeof apiUsers
export type ApiMembers = typeof apiMembers
export type ApiEmployees = typeof apiEmployees
