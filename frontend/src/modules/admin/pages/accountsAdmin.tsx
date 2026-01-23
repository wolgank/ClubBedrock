import { useNavigate } from "react-router-dom";
import { AccountsTable } from "../components/AccountsTable";
import { useGetAccounts } from "../hooks/useGetAccounts";
import { useLogicalDeleteAccount } from "../hooks/useLogicalDeleteAccount";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Asegúrate de importar el componente Button de shadcn/ui
import { ErrorAlert, InvalidUser } from "../components/ErrorAlert";

import React, { useEffect, useState } from "react";
import { EditUserForm } from "../components/EditUserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { EditAccountDialog } from "../components/EditAccountDialog";
import { BulkUploadButton } from "../components/BulkUploadButton";

export default function AccountsAdmin() {
  const { data: accounts, isLoading } = useGetAccounts();
  const { mutate: deleteAccount } = useLogicalDeleteAccount();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<InvalidUser["user"] | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);

  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas desactivar esta cuenta?")) {
      deleteAccount(id, {
        onError: (error) => {
          toast.error(`Error al desactivar: ${error.message}`);
        },
      });
    }
  };

  useEffect(() => {
    console.log("🔄 Accounts actualizados:", accounts);
  }, [accounts]);

  // Si está cargando o hubo un error, puedes mostrar un mensaje o un spinner
  if (isLoading) {
    return <div className="text-center">Cargando cuentas...</div>;
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl">Cuentas</h1>
          <BulkUploadButton></BulkUploadButton>
          <Button
            onClick={() => navigate("/admin/accounts/register")}
            className="bg-primary hover:bg-primary/90"
          >
            Registrar Nueva Cuenta
          </Button>
        </div>

        <AccountsTable
          data={accounts?.valid || []}
          onEdit={(id) => navigate(`/admin/accounts/${id}/edit`)}
          onDelete={handleDelete}
          onView={(id: number) => navigate(`/admin/accounts/${id}`)}
        />

        {accounts?.invalid?.length > 0 && (
        <ErrorAlert
          error={{
            message: "Se encontraron cuentas inválidas.",
            invalidUsers: accounts.invalid.map((item) => ({
              user: item.item.user,
              errors: item.errors,
            })),
          }}
          onFix={(user) => {
            const id = user.accountID ?? 0;
            navigate(`/admin/accounts/${id}/edit`);
          }}
        />
        )}
      </div>
    </div>
  );
}
