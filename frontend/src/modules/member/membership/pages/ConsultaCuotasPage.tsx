// src/modules/user/membership/pages/ConsultaCuotasPage.tsx
import React, { useEffect, useState } from "react";
import MembershipInfoCard, { Member } from "../components/MembershipInfoCard";
import QuotasTable, { Quota } from "../components/QuotasTable";
import SuspendMembershipModal from "../components/SuspendMembershipModal";
import DisaffiliateMembershipModal from "../components/DisaffiliateMembershipModal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/shared/context/UserContext";
import QuotaReceiptModal from "../components/QuotaReceiptModal";
import ChangeRequestsSection from "../components/ChangeRequestsSection";
import { getISOfromDate } from "@/shared/utils/utils";
import { useMembershipStatus } from "@/shared/hooks/useMembershipStatus"; 

export default function ConsultaCuotasPage() {
  const { user } = useUser();

  const { readOnly, loading: statusLoading } = useMembershipStatus();

  /* ---------- estado de miembro ---------- */
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);


  /* ---------- estado de cuotas ---------- */
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [quotasLoading, setQuotasLoading] = useState(true);

  /* ---------- modales ---------- */
  const [modalOpen, setModalOpen]       = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
  const [showSuspend, setShowSuspend]     = useState(false);
  const [showDisaffiliate, setShowDisaffiliate] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  /* ----------------- handler tabla → modal ----------------- */
  const handleAction = (q: Quota) => {
    setSelectedQuota(q);
    setModalOpen(true);
  };

  /* ----------------- carga de datos ----------------- */
  useEffect(() => {
    if (!user) return setLoadingMember(false);

    (async () => {
      try {
        const res = await fetch(
          `${backendUrl}/api/members/membership-overview`,
          { credentials: "include" }
        );
        const ov = await res.json();
        setMemberData({
          photoUrl: ov.profilePictureURL,
          names:    user.name!,
          surnames: user.lastname!,
          membershipCode: ov.codeMembership,
          startDate: new Date(ov.startDate).toLocaleDateString("es-PE", {
            day: "numeric", month: "long", year: "numeric",
          }),
          status: ov.state,
          balance: ov.pendingDebt,
          quotaAmount: ov.feeDebt,
          lateFee: ov.moratoriumDebt,
          membershipId: ov.idMembership,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMember(false);
      }
    })();
  }, [user, backendUrl]);

  /* ---- función reutilizable para cargar cuotas ---- */
  const loadQuotas = async () => {
    try {
      setQuotasLoading(true);
      const res = await fetch(`${backendUrl}/api/bill/fees`, {
        credentials: "include",
      });
      const raw: any[] = await res.json();

      const formatted: Quota[] = raw
        .filter((f) => parseFloat(f.finalAmount) > 0)
        .map((f) => {
          const created = getISOfromDate(new Date(f.createdAt)); // esto para que tenga el formato correcto
          const due     = getISOfromDate(new Date(f.dueDate));

          let status: Quota["status"];
          switch (f.status) {
            case "PAID":      status = "PAGADO";    break;
            case "PENDING":   status = "PENDIENTE"; break;
            case "OVERDUE":   status = "VENCIDO";   break;
            case "CANCELLED": status = "ANULADO";   break;
            default:          status = "PENDIENTE";
          }

          return {
            id: f.id,
            description: f.description,
            amount:     parseFloat(f.finalAmount),
            issueDate:  created,
            dueDate:    due,
            status,
          };
        });

      setQuotas(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setQuotasLoading(false);
    }
  };

  /* cargar cuotas al montar */
  useEffect(() => {
    loadQuotas();
  }, [backendUrl]);

  /* ----------------- renders ----------------- */
  if (loadingMember || quotasLoading) return <div>Cargando…</div>;
  if (!memberData) return <div>Error cargando la membresía</div>;

  return (
    <div className="p-4 text-gray-900 dark:text-gray-100">
      <MembershipInfoCard data={memberData} />

      {/* ─── Tabla de cuotas ─── */}
      <QuotasTable
        data={quotas}
        showActions={!readOnly}   // ✔ ya está
        onAction={handleAction}
        className="bg-white dark:bg-[#1f1f1f]"
      />

      {/* ─── Botones de suspender / anular ─── */}
      {!readOnly && (                                         // ← aquí
        <div className="flex flex-wrap justify-center gap-6 my-8">
          <Button
            className="button3-custom text-[var(--text-light)] px-10 py-3 font-semibold tracking-wide"
            onClick={() => setShowSuspend(true)}
          >
            SUSPENDER&nbsp;MEMBRESÍA
          </Button>

          <Button
            className="button4-custom text-[var(--text-light)] px-10 py-3 font-semibold tracking-wide"
            onClick={() => setShowDisaffiliate(true)}
          >
            ANULAR&nbsp;MEMBRESÍA
          </Button>
        </div>
      )}

      {/* ─── Modales: solo si hay permisos ─── */}
      {!readOnly && (                                         // ← y aquí
        <>
          <QuotaReceiptModal
            open={modalOpen}
            quota={selectedQuota}
            onClose={() => {
              setModalOpen(false);
              loadQuotas();
            }}
            onPaid={loadQuotas}
          />

          <SuspendMembershipModal
            open={showSuspend}
            onClose={() => setShowSuspend(false)}
            membershipId={memberData.membershipId}
          />

          <DisaffiliateMembershipModal
            open={showDisaffiliate}
            onClose={() => setShowDisaffiliate(false)}
            membershipId={memberData.membershipId}
          />
        </>
      )}

      {/* Sección que siempre es de solo-lectura */}
      <ChangeRequestsSection />
    </div>
  );
}