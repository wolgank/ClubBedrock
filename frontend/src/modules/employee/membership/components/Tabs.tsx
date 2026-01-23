// src/modules/employee/membership/components/Tabs.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Tabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Rutas a las que corresponden las dos pestañas
  const solicitudesPath   = '/employee-membership/solicitud';
  const familiaresPath    = '/employee-membership/familiares';

  const isSolicitudes = pathname.startsWith(solicitudesPath);
  const isFamiliares  = pathname.startsWith(familiaresPath);

  const baseClass = 'px-4 py-2 font-medium';
  const activeClass   = 'border-b-2 border-[var(--brand)]';
  const inactiveClass = 'text-[var(--brand)] hover:text-[var(--brand-light)]';

  return (
    <nav className="flex gap-6">
      <Button
        variant="ghost"
        onClick={() => navigate(solicitudesPath)}
        className={`${baseClass} ${isSolicitudes ? activeClass : inactiveClass}`}
      >
        Solicitudes de membresía
      </Button>

      <Button
        variant="ghost"
        onClick={() => navigate(familiaresPath)}
        className={`${baseClass} ${isFamiliares ? activeClass : inactiveClass}`}
      >
        Gestión de Familiares
      </Button>
    </nav>
  );
}
