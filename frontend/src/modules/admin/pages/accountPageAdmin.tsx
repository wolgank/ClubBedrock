import { FC, useEffect, useState } from "react";
import { useGetAccountById } from "../hooks/useGetAccountById";
import { AccountForm } from "../components/AccountForm"; 
import { Account } from "../schema/AccountSchema";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useUpdateAccount } from "../hooks/useUpdateAccount";
import { useRegisterAccount } from "../hooks/useRegisterAccount"; // Importa el nuevo hook
import { toast } from "sonner";

const AccountPageAdmin: FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Determinar el modo basado en la URL
    const isEditMode = location.pathname.endsWith("/edit");
    const isRegisterMode = location.pathname.endsWith("/register");
    
    // Si estamos en modo registro, no necesitamos accountId
    if (!isRegisterMode && !accountId) {
        return <div>Error: No se proporcionó un ID de cuenta.</div>;
    }
    const id = Number(accountId);
      
    let accountData: Account | null = null;
    
    const { data, isLoading, error } = useGetAccountById(id,{
      enabled: !isRegisterMode,
    });
    const { mutate: update, isPending: isUpdating } = useUpdateAccount();
    const { mutate: register, isPending: isRegistering } = useRegisterAccount(); // Hook para registro
    
    if (!isRegisterMode) {
      if (isLoading) return <div>Loading...</div>;
      if (error || !data) {
        console.error("Error al obtener la cuenta:", error);
        return <div>Error loading account data.</div>;
      }
      accountData = data;
    } else {
      accountData = null;
    }
    

    return (
        <div>
            <h1 className="text-center text-2xl m-4">
                {isRegisterMode ? "Registrar nueva cuenta" : "Detalles de la cuenta"}
            </h1>
            
            <AccountForm 
                mode={isRegisterMode ? "register" : isEditMode ? "update" : "view"}
                initialData={accountData} 
                onSubmit={(formData) => {
                    if (isRegisterMode) {
                        // Lógica para registro
                        register(formData, {
                            onSuccess: () => {
                                toast.success("Cuenta registrada correctamente");
                                navigate(`/admin/accounts`);
                            },
                            onError: (error) => {
                                toast.error("Error al registrar la cuenta: " + error.message);
                            },
                        });
                    } else if (isEditMode) {
                        // Lógica para actualización
                        update( formData,
                            {
                                onSuccess: () => {
                                    toast.success("Cuenta actualizada correctamente");
                                    navigate(`/admin/accounts`);
                                },
                                onError: (error) => {
                                    toast.error("Error al actualizar la cuenta: " + error.message);
                                },
                            }
                        );
                    }
                }}
            />
        </div>
    );
};

export default AccountPageAdmin;