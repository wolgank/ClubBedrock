// src/shared/hooks/useMembershipStatus.ts
import { useEffect, useState } from "react";
import { useMembership } from "@/shared/context/MembershipContext";

export function useMembershipStatus() {
  const { status, setStatus, readOnly } = useMembership();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState(!status); // si ya viene, no cargamos

  useEffect(() => {
    if (status) return;               // ya tenemos el dato → nada que hacer

    (async () => {
      try {
        const res = await fetch(
          `${backendUrl}/api/members/membership-overview`,
          { credentials: "include" }
        );
        const ov = await res.json();
        setStatus(ov.state);          // guarda "ACTIVE", "ENDED", etc.
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, backendUrl, setStatus]);

  return { readOnly, loading };
}
