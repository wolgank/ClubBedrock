import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClubConfig } from "../hooks/useClubConfig";

export default function ConfigAdminForm() {
  const {
    register,
    handleSubmit,
    saveConfig,
    logoFile,
    setLogoFile,
    coverFile,
    setCoverFile,
    watch,
  } = useClubConfig();

  // Previews para logo y portada (portadaURL)
  const logoPreview = logoFile
  ? URL.createObjectURL(logoFile)
  : watch("logoUrl") ?? null;

const coverPreview = coverFile
  ? URL.createObjectURL(coverFile)
  : watch("portadaURL") ?? null;

  const onSubmit = handleSubmit(saveConfig);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col items-center gap-5 p-5 relative rounded-xl background-custom w-full max-w-4xl mx-auto"
    >
      {/* Título principal */}
      <div className="flex flex-col w-full items-center relative">
        <h1 className="font-bold text-[var(--brand)] text-2xl dark:text-[var(--primary)]">
          Configuración General del Club
        </h1>
      </div>

      {/* Sección Información básica */}
      <div className="flex w-full items-start gap-2.5 px-2 py-0 relative">
        <div className="inline-flex flex-col items-start gap-2.5 px-2.5 py-0 relative overflow-hidden w-full">
          <h2 className="font-semibold text-[var(--brand)] text-xl dark:text-[var(--primary)] border-b border-[var(--border-custom)] pb-2 w-full">
            Información básica
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 w-full">
        {/* Nombre oficial */}
        <div className="col-span-2">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="name">Nombre oficial</Label>
          <Input 
            id="name" 
            {...register("name", { required: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Teléfono */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="phone">Teléfono</Label>
          <Input 
            id="phone" 
            {...register("phone")}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Dirección */}
        <div className="col-span-2">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="address">Dirección</Label>
          <Input 
            id="address" 
            {...register("address")}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Email */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="email">Email</Label>
          <Input 
            type="email" 
            id="email" 
            {...register("email")}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Eslogan */}
        <div className="col-span-2">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="slogan">Eslogan</Label>
          <Input 
            id="slogan" 
            {...register("slogan")}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Sección Tasas y límites */}
        <div className="col-span-3 flex w-full items-start gap-2.5 px-2 py-0 relative mt-4">
          <div className="inline-flex flex-col items-start gap-2.5 px-2.5 py-0 relative overflow-hidden w-full">
            <h2 className="font-semibold text-[var(--brand)] text-xl dark:text-[var(--primary)] border-b border-[var(--border-custom)] pb-2 w-full">
              Tasas y límites
            </h2>
          </div>
        </div>

        {/* Tasa de moratoria */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="moratoriumRate">Tasa de moratoria (%)</Label>
          <Input
            type="number"
            id="moratoriumRate"
            {...register("moratoriumRate", { valueAsNumber: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Máximo invitados por mes */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="maxGuestsNumberPerMonth">Máximo invitados por mes</Label>
          <Input
            type="number"
            id="maxGuestsNumberPerMonth"
            {...register("maxGuestsNumberPerMonth", { valueAsNumber: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Máximo horas reserva por día y espacio */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="maxMemberReservationHoursPerDayAndSpace">
            Máx. horas reserva por día y espacio
          </Label>
          <Input
            type="number"
            id="maxMemberReservationHoursPerDayAndSpace"
            {...register("maxMemberReservationHoursPerDayAndSpace", {
              valueAsNumber: true,
            })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Máximo horas reserva por día */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="maxMemberReservationHoursPerDay">Máximo horas reserva por día</Label>
          <Input
            type="number"
            id="maxMemberReservationHoursPerDay"
            {...register("maxMemberReservationHoursPerDay", { valueAsNumber: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Tasa devolución reserva */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="devolutionReservationRate">Tasa devolución reserva (%)</Label>
          <Input
            id="devolutionReservationRate"
            type="number"
            {...register("devolutionReservationRate", { valueAsNumber: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Tasa devolución inscripción evento */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="devolutionEventInscriptionRate">
            Tasa devolución inscrip. evento (%)
          </Label>
          <Input
            id="devolutionEventInscriptionRate"
            type="number"
            {...register("devolutionEventInscriptionRate", { valueAsNumber: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Tasa devolución inscripción academia */}
        <div className="col-span-1">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="devolutionAcademyInscriptionRate">
            Tasa devolución inscripción academia (%)
          </Label>
          <Input
            id="devolutionAcademyInscriptionRate"
            type="number"
            {...register("devolutionAcademyInscriptionRate", { valueAsNumber: true })}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Sección Horarios y archivos */}
        <div className="col-span-3 flex w-full items-start gap-2.5 px-2 py-0 relative mt-4">
          <div className="inline-flex flex-col items-start gap-2.5 px-2.5 py-0 relative overflow-hidden w-full">
            <h2 className="font-semibold text-[var(--brand)] text-xl dark:text-[var(--primary)] border-b border-[var(--border-custom)] pb-2 w-full">
              Horarios y archivos
            </h2>
          </div>
        </div>

        {/* Horario de atención */}
        <div className="col-span-2">
          <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="openHours">Horario de atención</Label>
          <Input 
            id="openHours" 
            {...register("openHours")}
            className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
          />
        </div>

        {/* Logo del club */}
        <div className="col-span-3 flex gap-6 items-center">
          <div className="flex-1">
            <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="logoFile">Logo del club</Label>
            <Input
              type="file"
              id="logoFile"
              accept="image/*"
              onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
              className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
            />
          </div>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Vista previa del logo"
              className="w-24 h-24 object-contain rounded border border-[var(--border-custom)]"
            />
          )}
        </div>

        {/* Imagen de portada */}
        <div className="col-span-3 flex gap-6 items-center">
          <div className="flex-1">
            <Label className="text-[var(--brand)] dark:text-[var(--primary)]" htmlFor="coverFile">Imagen de portada</Label>
            <Input
              type="file"
              id="coverFile"
              accept="image/*"
              onChange={(e) => e.target.files && setCoverFile(e.target.files[0])}
              className="border-[var(--border-custom)] bg-white dark:bg-gray-900"
            />
          </div>
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Vista previa de la portada"
              className="w-48 h-24 object-cover rounded border border-[var(--border-custom)]"
            />
          )}
        </div>

        {/* Botón de guardar */}
        <div className="col-span-3 mt-4">
          <Button 
            type="submit" 
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white dark:bg-[var(--primary)] dark:hover:bg-[var(--primary)]/90 dark:text-[var(--brand)] transition-colors duration-200"
          >
            Guardar configuración
          </Button>
        </div>
      </div>
    </form>


  );
}
