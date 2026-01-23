import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useClubConfig } from "@/modules/admin/hooks/useClubConfig";
import { toast } from "sonner";
import { ClubConfig } from "@/modules/admin/schema/ConfigSchema";

export const ClubConfigRatesDialog: React.ComponentType<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        saveConfig,
        config,
        reset,
        setValue,
      } = useClubConfig();

  // Resetear el formulario cuando se abre/cierra o cuando cambia la configuración
  const onSubmit = handleSubmit(async (data) => {
    try {
      await saveConfig(); // Este ya muestra el toast
      onClose();
    } catch (error) {
      // El error ya se maneja en saveConfig
    }
  });
  useEffect(() => {
    if (open && config) {
      reset({
        ...config,
        moratoriumRate: config.moratoriumRate,
        paymentDeadlineDays: config.paymentDeadlineDays
      });
    }
  }, [open, config, reset]);

  const handleNumberChange = (field: keyof ClubConfig) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Actualiza el valor en react-hook-form
      setValue(field, value === "" ? "" : Number(value));
    };

  

  return (
        <div className="w-[300px]">
        <DialogHeader>
          <DialogTitle>Configurar Parámetros Financieros</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tasa de interés anualizada</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("moratoriumRate", {
                  valueAsNumber: true,
                })}
                onChange={handleNumberChange("moratoriumRate")}
                className="pr-8"
              />
              <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
            </div>
            {errors.moratoriumRate && (
              <p className="text-sm text-destructive">
                {errors.moratoriumRate.message}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Días de plazo para pagos</Label>
            <Input
              type="number"
              min="1"
              {...register("paymentDeadlineDays", {
                valueAsNumber: true,
              })}
              onChange={handleNumberChange("paymentDeadlineDays")}
            />
            {errors.paymentDeadlineDays && (
              <p className="text-sm text-destructive">
                {errors.paymentDeadlineDays.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
        </div>
  );
};