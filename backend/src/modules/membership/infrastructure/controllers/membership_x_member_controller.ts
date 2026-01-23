import type { Context } from "hono";
import * as membershipXMemberService from "../../application/membership_x_member_service";
import { membershipXMemberSelectSchema } from "../../../../db/schema/MembershipXMember";

export const getUsersByCommonMemberships = async (c: Context) => {
  const id = Number(c.req.param("id"));
  //console.log("ID", id);
  const member = await membershipXMemberService.getUsersByCommonMemberships(id);
    if (member.length === 0) {
        return c.json({ message: "No se encontraron usuarios relacionados" }, 404);
    }
    
  return c.json(member, 200);
};