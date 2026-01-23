import { Hono } from 'hono';
import * as membershipXMemberController from '../controllers/membership_x_member_controller';

const membershipXMemberRouter = new Hono()

    .get('/:id', membershipXMemberController.getUsersByCommonMemberships)

export default membershipXMemberRouter;