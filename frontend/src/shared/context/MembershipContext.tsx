// src/shared/context/MembershipContext.tsx
import React, { createContext, useContext, useState } from "react";
import type { Member } from "@/modules/member/membership/components/MembershipInfoCard";
interface Ctx {
  status:    Member["status"] | null;
  readOnly:  boolean;
  setStatus: (s: Member["status"]) => void;
}
const MembershipContext = createContext<Ctx>({
  status: null,
  readOnly: true,
  setStatus: () => {},
});
export const useMembership = () => useContext(MembershipContext);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Member["status"] | null>(null);
  const readOnly = status !== "ACTIVE";
  return (
    <MembershipContext.Provider value={{ status, readOnly, setStatus }}>
      {children}
    </MembershipContext.Provider>
  );
}
