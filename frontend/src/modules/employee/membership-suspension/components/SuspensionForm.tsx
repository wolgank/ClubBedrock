// src/modules/employee/membership-suspension/components/SuspesionForm.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ConfirmSuspendModal from "./ConfirmSuspendModal";

export default function SuspensionForm() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="bg-[#f3f0ea] max-w-[700px] mx-auto">
      <CardContent className="p-6 flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-[#318161]">Suspender Membresía</h1>

        <section className="grid md:grid-cols-3 gap-4">
          <L>N° Socio<Input disabled value="1122" /></L>
          <L>Nombre del Socio<Input disabled value="Carla Gómez" /></L>
          <L>Estado actual<Input disabled value="Activo" /></L>

          <L>Último Pago<Input disabled value="12/12/2024" type="date" /></L>
          <L>Días en Mora<Input disabled value="0" /></L>
          <L>Importe Adeudado<Input disabled value="S/ 0" /></L>
        </section>

        <hr />

        <section className="grid md:grid-cols-3 gap-4">
          <L>Fecha de inicio<Input type="date" /></L>
          <L>Fecha de fin (opcional)<Input type="date" /></L>
          <L>Motivo<Input /></L>
        </section>

        <L>Detalles adicionales<Textarea rows={4} /></L>

        <L>Notas internas<Textarea rows={4} /></L>

        <div className="flex gap-4 justify-center mt-4">
          <Button className="bg-[#142e38]" onClick={() => setOpen(true)}>Suspender</Button>
          <Button variant="outline" onClick={() => history.back()}>Regresar</Button>
        </div>

      </CardContent>

      {/* NO EXISTE MEMBER EN DATA!!!! GAAA */}

      {/* {open && <ConfirmSuspendModal data={{member:"Carla Gómez",id:2318}} onClose={()=>setOpen(false)}/>} */}
    </Card>
  );
}

function L({ children }: { children: React.ReactNode }) { return <div className="flex flex-col gap-1">{children}</div> }
