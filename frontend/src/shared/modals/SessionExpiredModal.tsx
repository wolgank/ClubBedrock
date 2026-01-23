import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
}

export default function SessionExpiredModal({ open }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] h-full">
      <div className="background-custom rounded-xl w-md sm:w-4/5 sm:max-w-md relative p-6 text-center">

        {/* Título */}
        <h2 className="text-xl font-bold mb-4 text-[var(--brand)] dark:text-[var(--brand)]">
          Sesión expirada
        </h2>

        {/* Mensaje */}
        <p className="mb-6">
          Tu sesión ha expirado. Por favor, vuelve a iniciar sesión para continuar.
        </p>

        {/* Botón obligatorio */}
        <Button
          className="px-6 py-2 rounded button3-custom text-[var(--text-light)] w-full"
          onClick={() => (window.location.href = "/login")}
        >
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
