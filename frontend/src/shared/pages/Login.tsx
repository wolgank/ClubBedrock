import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
async function  memberPaidFirstFee() :Promise<boolean> {
  try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/members/first-payment`, {
        method: "GET",
        credentials: "include",
        //headers: { "Content-Type": "application/json" },
      });
      //console.log("res: ",res)
      
      if (!res.ok) throw new Error("Error");

      const data = await res.json();
      //console.log("data: ",data)
      //console.log("return : ",data.paid)
      return data.paid ;
    } catch (err: unknown) {
      if (err instanceof Error) {
        const message = err instanceof Error ? err.message : "Ocurrió un error desconocido";
        toast.error(message);
      } else {
        toast.error("Ocurrió un error desconocido, pero te dejaré pasar, por ahora");
      }
      
    } finally {
      //return true; //por que está comentado???-Ariel
     // toast.error("No se pudo determinar si pagó o no la cuota de ingreso");
    }
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Credenciales incorrectas");

      ////console.log("Login exitoso:", data);

      const meRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!meRes.ok) toast.error("No se pudo obtener el usuario");

      const userData = await meRes.json();
      const { account } = userData;

      window.dispatchEvent(new Event("authChanged"));

      if (account.role === "GUEST") {
        navigate(`/register/form`);
      } else if (account.role === "MEMBER"){
        if (await memberPaidFirstFee()) {
          navigate("/");
        } else {
          navigate("/membresia/first-payment");
        }
      }else{
        navigate ("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Ocurrió un error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    ////console.log("✅ Google credential recibida:", credentialResponse);

    try {
      ////console.log("📡 Enviando credential al backend...");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credentialResponse }),
      });

      ////console.log("🔁 Respuesta de /auth/google:", res.status);

      if (!res.ok) toast.error("❌ Error al iniciar sesión con Google");

      const meRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!meRes.ok) toast.error("❌ No se pudo obtener el usuario");

      const userData = await meRes.json();
      const { account } = userData;

      window.dispatchEvent(new Event("authChanged"));

      if (account.role === "GUEST") {
        navigate(`/register/form`);
      } else {
        if(account.role === "MEMBER"){
          if (await memberPaidFirstFee()) {
            navigate("/");
          } else {
            navigate("/membresia/first-payment");
          }
        }else{
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("🔥 Error al iniciar con Google:", error);
      toast.error("Error con Google");
    }
  };

  const handleGoogleLoginError = () => {
    ////console.log("❌ Falló el inicio con Google");
    toast.error("Falló el inicio con Google");
  };

  return (
    <div className="auth-background">
      <div className="auth-card">
        <div className="form-panel">
          <h2 className="text-3xl font-bold mb-6">
            Inicio de Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
              />
            </div>

            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-gray-100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <p className="text-sm text-right">
              <Link to="/forgot-password" className="text-[var(--brand)] hover:underline">
                ¿Olvidaste la contraseña?
              </Link>
            </p>

            <Button
              type="submit"
              className="w-full py-3 bg-[var(--brand)] text-white rounded-full hover:bg-[var(--brand-light)] transition"
              disabled={loading}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>

            <p className="text-sm text-center">
              ¿No tienes una cuenta?{" "}
              <Link to="/register" className="text-[var(--brand)] hover:underline">
                Regístrate ahora
              </Link>
            </p>
          </form>
        </div>

        <div className="media-panel">
          <video src={`${import.meta.env.VITE_BACKEND_URL_MEDIA}/login.mp4`} autoPlay loop muted />
          <div className="media-overlay">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
              Cada amigo es una nueva aventura.
            </h2>
            <p className="text-xl md:text-2xl font-bold text-white/90 mb-6">
              Conectémonos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;



