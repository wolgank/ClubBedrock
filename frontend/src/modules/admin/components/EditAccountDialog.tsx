import { useState } from "react";
import { useUpdateAccount } from "../hooks/useUpdateAccount";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Account } from "@/modules/admin/schema/AccountSchema"

type Props = {
  open: boolean;
  onClose: () => void;
  account: Account;
};

export function EditAccountDialog({ open, onClose, account }: Props) {
  const [formData, setFormData] = useState<Account>(account);
  const updateAccount = useUpdateAccount();

  const handleChange = (section: "auth" | "user", field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    updateAccount.mutate(
      {
        accountId: formData.auth.id,
        formData,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error al actualizar:", error);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Corregir cuenta inválida</DialogTitle>
          <DialogDescription>
            Por favor, corrige el correo y número de teléfono antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              value={formData.auth.email}
              onChange={(e) => handleChange("auth", "email", e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.user.phoneNumber ?? ""}
              onChange={(e) => handleChange("user", "phoneNumber", e.target.value)}
              placeholder="987654321"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={updateAccount.isPending}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
