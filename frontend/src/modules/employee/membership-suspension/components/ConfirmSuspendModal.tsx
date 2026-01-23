import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  data: {
    id:                number;
    action:            "suspend" | "annul";
    managerNotes:      string;
    changeStartDate:   string;
    changeEndDate:     string | null;
  };
  onClose: () => void;
}

export default function ConfirmSuspendModal({ data, onClose }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const handleConfirm = async () => {
    setLoading(true);
    const payload = {
      membership:       data.id,
      type:             data.action === "annul" ? "DISAFFILIATION" : "SUSPENSION",
      managerNotes:     data.managerNotes,
      changeStartDate:  data.changeStartDate,
      changeEndDate:    data.changeEndDate,
    };
    const res = await fetch(`${backendURL}/api/membership-change-requests/managerRequest`, {
      method:  "POST",
      credentials: "include",    // <— aquí
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    setLoading(false);
    const body = await res.json();
    //console.log("managerRequest response:", body);
    if (res.ok) {
      onClose();
    } else {
      // TODO: mostrar error
      console.error("Error del servidor:", body);
    }
  };

  const confirmText = data.action === "annul" ? "Anular" : "Suspender";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <Card className="background-custom">
        <CardContent className="px-6 py-1 w-full max-w-sm">
          <h3 className="text-xl font-bold mb-4">Confirmación</h3>
          <p>
            {data.action === "annul"
              ? `Está por anular la membresía #${data.id}.`
              : `Está por suspender la membresía #${data.id}.`}
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Procesando…" : confirmText}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Regresar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}