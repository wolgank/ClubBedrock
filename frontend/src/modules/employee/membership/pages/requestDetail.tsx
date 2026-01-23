// src/modules/employee/membership/pages/requestDetail.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

import ApplicationNavSection from '../../shared/components/ApplicationNavSection'
import Tabs from '../components/Tabs'
import RequestDetailForm from '../components/RequestDetailForm'
import ApproveModal from '../components/ApproveModal'
import RejectModal from '../components/RejectModal'
import { Button } from '@/components/ui/button'
import HelpAndSupportSection from '../../shared/components/HelpAndSupportSection'

export default function RequestDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [correo, setCorreo] = useState("")
  // callback tras confirmar en el modal
  const onConfirmApprove = () => {
    // TODO: llamada a tu API de aprobación pasando `id`
    setApproveOpen(false)
    navigate(-1) // vuelve atrás
  }
  const onConfirmReject = () => {
    // TODO: llamada a tu API de rechazo pasando `id`
    setRejectOpen(false)
    navigate(-1)
  }

  return (
    <div className="flex flex-col items-center px-[34px] py-[57px] bg-white">
      {/* 1) Navegación principal */}
      <ApplicationNavSection />

      {/* 2) Tabs internas (Solicitudes / Gestión de Familiares) */}
      <div className="w-full max-w-[1343px] mt-6">
        <Tabs />
      </div>

      {/* 3) Título */}
      <h1 className="w-full max-w-[1343px] text-4xl font-bold my-6">
        Detalle de Solicitud de Membresía
      </h1>

      {/* 4) Formulario con datos */}
      <section className="w-full max-w-[1343px] bg-[var(--bg-light-alt)] p-[30px] rounded-2xl">
        {/* Tu componente que despliega los campos en readonly */}
        <RequestDetailForm
          requestId={Number(id)}
          onLoaded={(correo) => {
            console.log("📩 Correo recibido desde RequestDetailForm:", correo);
          }}
        />

      </section>

      {/* 5) Botones de acción */}
      <div className="w-full max-w-[1343px] flex justify-end gap-3 mt-6">
        <Button onClick={() => setApproveOpen(true)}>Aceptar Solicitud</Button>
        <Button variant="secondary" onClick={() => setRejectOpen(true)}>
          Rechazar Solicitud
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>

      {/* 6) Help & Support */}
      <div className="w-full max-w-[1343px] text-center mt-10">
        <HelpAndSupportSection />
      </div>

      {/* 7) Modales */}
      {approveOpen && (
        <ApproveModal
          id={Number(id)}
          name={`#${id}`}
          correo={correo}
          onClose={() => {
            setApproveOpen(false)
            onConfirmApprove()
          }}
        />
      )}
      {rejectOpen && (
        <RejectModal
          id={Number(id)}
          name={`#${id}`}
          onClose={() => {
            setRejectOpen(false)
            onConfirmReject()
          }} accountId={0} />
      )}
    </div>
  )
}
