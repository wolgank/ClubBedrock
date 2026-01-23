import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DialogNotX } from '@/shared/components/ui/DialogNotX';

export const SuccessModal = ({ showModal, setShowModal }) => {
    const navigate = useNavigate();
    const handleRedirect = () => {
    setShowModal(false);
    navigate('/');
  };
     return (
    <Dialog open={showModal}>
      <DialogNotX
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-sm sm:rounded-2xl text-center px-6 py-8 border background-custom [&>button[aria-label=Close]]:hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--brand)]">
            🎉 ¡Solicitud enviada!
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm mt-2">
          Pronto recibirás una respuesta al correo que proporcionaste.
        </p>

        <DialogFooter className="mt-6 flex justify-center">
          <Button className="w-full button3-custom text-[var(--text-light)]" onClick={handleRedirect}>
            Ir al inicio
          </Button>
        </DialogFooter>
      </DialogNotX>
    </Dialog>
  );
};