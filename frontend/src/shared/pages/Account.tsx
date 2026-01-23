import { useUser } from "../context/UserContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, ShieldCheck, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const { account, user, loading } = useUser();

  if (loading) return <p className="text-center mt-10">Cargando datos...</p>;
  if (!account || !user) return <p className="text-center mt-10">No estás autenticado.</p>;

  const isGoogleLinked = account.email.endsWith("@gmail.com");

  return (
    <div className="max-w-xl mx-auto mt-12 space-y-8">
      <Card className="p-6 space-y-6 shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold">Perfil de usuario</h2>

        <div className="space-y-2">
          <Label>Nombre completo</Label>
          <Input disabled value={`${user.name} ${user.lastname}`} />
        </div>

        <div className="space-y-2">
          <Label>Correo electrónico</Label>
          <Input disabled value={account.email} />
        </div>

        <div className="space-y-2">
          <Label>Rol</Label>
          <Input disabled value={account.role} />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Link2 className="w-5 h-5" />
          {isGoogleLinked ? (
            <span className="text-sm text-green-600">Vinculado con Google</span>
          ) : (
            <Button variant="secondary" onClick={() => toast.message("Función de vinculación próximamente")}>
              Vincular con Google
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}