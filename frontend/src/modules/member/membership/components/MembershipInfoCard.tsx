// src/modules/user/membership/components/MembershipInfoCard.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

/* ──────────────── Tipos ──────────────── */
export interface Member {
  membershipId:   number;
  photoUrl:       string;
  names:          string;
  surnames:       string;
  membershipCode: string;
  startDate:      string;
  status:         "ENDED" | "ACTIVE" | "ON_REVISION" | "PRE_ADMITTED";
  balance:        number;
  quotaAmount:    number;
  lateFee:        number;
}

/* ──────────────── Utilidades ──────────────── */
const STATUS_ES: Record<Member["status"], string> = {
  ENDED:        "Inactiva",
  ACTIVE:       "Activa",
  ON_REVISION:  "En revisión",
  PRE_ADMITTED: "Pre-admitida",
};

/* ──────────────── Componente ──────────────── */
export default function MembershipInfoCard({ data }: { data: Member }) {
  const estado = STATUS_ES[data.status] ?? data.status;   // fallback por si llegara otro estado

  return (
    <Card className="background-custom rounded-2xl shadow-md my-6">
      <CardContent className="flex gap-8 p-6">
        <img
          src={data.photoUrl}
          alt={`${data.names} ${data.surnames}`}
          className="w-48 h-48 object-cover rounded-lg"
        />

        <div className="flex-1">
          <h2 className="text-3xl font-semibold mb-2">
            {data.names} {data.surnames}
          </h2>

          <p>Código de membresía: {data.membershipCode}</p>
          <p>
            Fecha de inicio: {data.startDate}. 
          </p>

          <p>Estado: {estado}</p>

          <div className="mt-4 space-y-1">
            <p>Saldo pendiente:&nbsp;S/.&nbsp;{data.balance}</p>
            <p>Monto por cuotas:&nbsp;S/.&nbsp;{data.quotaAmount}</p>
            <p>Monto por moras:&nbsp;S/.&nbsp;{data.lateFee}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
