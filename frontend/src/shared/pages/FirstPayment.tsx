// src/modules/user/membership/components/FirstPayment.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input }   from "@/components/ui/input";
import { Button }  from "@/components/ui/button";
import { CreditCard, ChevronRight } from "lucide-react";
import { useUser } from "@/shared/context/UserContext";
import { toast } from "sonner";

/* ─── Tipos ───────────────────────────────────────── */
interface AdmissionFee {
  id:          number;
  finalAmount: number;
  status:      string;   // "PENDING" | "EXPIRED" | "PAID" | ...
  description: string;
  createdAt:   string;
  dueDate:     string;
}

/* ─── Componente ─────────────────────────────────── */
export default function FirstPayment() {
  const { account }  = useUser();
  const backendUrl   = import.meta.env.VITE_BACKEND_URL;
  const navigate     = useNavigate();

  /* Boleta */
  const [fee, setFee]       = useState<AdmissionFee | null>(null);
  const [loading, setLoad]  = useState(true);

  /* Form tarjeta */
  const [showCardForm, setShowCardForm] = useState(true);
  const [cardNumber, setCardNumber]     = useState("");
  const [cvv, setCvv]                   = useState("");
  const [expiry, setExpiry]             = useState("");
  const [cardName, setCardName]         = useState("");
  const [submitting, setSubmitting]     = useState(false);

  /* ── 0) ¿Ya pagó? ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/members/first-payment`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { paid } = await res.json();
        if (paid) {
          toast.success("Ya realizaste este pago. ¡Bienvenido!");
          navigate("/");
          return;
        }
      } catch (err) {
        console.error("Error verificando pago inicial:", err);
      } finally {
        setLoad(false); // continuar flujo
      }
    })();
  }, [backendUrl, navigate]);

  /* ── 1) Traer la boleta ───────────────────────── */
  useEffect(() => {
    if (loading) return; // esperamos verificación previa
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/bill/admissionFee`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { bill } = await res.json();

        const feeData: AdmissionFee = {
          id:          bill.id,
          description: bill.description,
          status:      bill.status,
          createdAt:   bill.createdAt,
          dueDate:     bill.dueDate,
          finalAmount: parseFloat(bill.finalAmount),
        };
        //console.log("estado de la boleta:", feeData.status);
        setFee(feeData);
      } catch (err) {
        console.error("Error fetching admission fee:", err);
        toast.error("No se pudo cargar el detalle del pago.");
      }
    })();
  }, [loading, backendUrl, account]);

  /* ── 2) Validaciones simples de tarjeta ───────── */
  const numberOk = /^\d{13,19}$/.test(cardNumber.replace(/\s+/g, ""));
  const cvvOk    = /^\d{3,4}$/.test(cvv);
  const expiryOk = (() => {
    const m = expiry.match(/^(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const [mm, yyyy] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (mm < 1 || mm > 12) return false;
    return new Date(yyyy, mm) > new Date();
  })();
  const nameOk   = cardName.trim().length > 0;
  const formOk   = numberOk && cvvOk && expiryOk && nameOk;

  /* ── 3) Pagar ─────────────────────────────────── */
  const handlePay = async () => {
    if (!fee) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/bill/pay-admission-fee`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: fee.id, paymentMethod: "CREDIT_CARD" }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Detalle 400 →", payload);
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }
      toast.success("Pago realizado correctamente 🎉");
      navigate("/");
    } catch (err) {
      console.error("Error al procesar pago:", err);
      toast.error(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 4) Render ────────────────────────────────── */
  if (loading || !fee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando pago inicial…</p>
      </div>
    );
  }

  /* Si la boleta NO está pagable mostrarmos aviso */
  const notPayable = fee.status !== "PENDING" && fee.status !== "OVERDUE";
  if (notPayable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-xl shadow max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-green-900">
            Esta cuota ya fue procesada
          </h2>
          <p className="mt-4 text-gray-700">
            Si crees que esto es un error, contacta a soporte.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-700 to-green-800 dark:from-green-900 dark:to-green-950 p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-3xl p-8">
      <h1 className="text-4xl font-bold text-green-900 dark:text-green-100 text-center">
          ¡Fuiste aceptado!
        </h1>
        <p className="mt-2 text-center text-green-800">
          Realiza el pago inicial para iniciar tu experiencia como socio en Club Bedrock
        </p>

        {/* Tarjeta de pago */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-green-900 dark:text-green-100 text-center">

            Pago de cuota de ingreso
          </h2>

          {/* Detalle */}
          <div className="mt-6">
          <h3 className="text-lg font-medium text-green-700 dark:text-green-200">Detalle del pago</h3>
            <div className="mt-2 grid grid-cols-2 gap-x-4">
              <div>
                <span className="block font-medium">Importe:</span>
                <span className="block mt-1">S/. {fee.finalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="block font-medium">Concepto:</span>
                <span className="block mt-1">{fee.description}</span>
              </div>
            </div>
            <hr className="my-6 border-gray-200" />
          </div>

          {/* Accordion tarjeta */}
          <h3 className="text-lg font-medium text-green-700 dark:text-green-200">Métodos de Pago</h3>
          <button
            onClick={() => setShowCardForm(!showCardForm)}
            className="mt-4 w-full flex items-center justify-between bg-gray-100 p-4 rounded-lg hover:bg-gray-200"
          >
            <div className="flex items-center space-x-2">
              <CreditCard size={20} className="text-green-900" />
              <span className="font-medium text-green-900">
                Tarjeta de Débito / Crédito
              </span>
            </div>
            <ChevronRight
              size={20}
              className={
                showCardForm
                  ? "transform rotate-90 text-green-900"
                  : "text-green-900"
              }
            />
          </button>

          {showCardForm && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Número de Tarjeta
                </label>
                <Input
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className={!numberOk ? "border-red-500" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    CVV/CVC
                  </label>
                  <Input
                    placeholder="XXX"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className={!cvvOk ? "border-red-500" : ""}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    Válido hasta
                  </label>
                  <Input
                    placeholder="mm/aaaa"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className={!expiryOk ? "border-red-500" : ""}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Nombre
                </label>
                <Input
                  placeholder="Nombre en la tarjeta"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className={!nameOk ? "border-red-500" : ""}
                />
              </div>

              <Button
                className="w-full mt-4 bg-green-800 hover:bg-green-900"
                onClick={handlePay}
                disabled={submitting || !formOk}
              >
                Realizar pago
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
