import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, X as CloseIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useUser } from '../context/UserContext'
import { toast } from 'sonner'

const NewRegister: React.FC = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [showTerms, setShowTerms] = useState(false)
  const openTerms = async () => {
    try {
      const res = await fetch('/terms.txt');
      const txt = await res.text();
      setTermsText(txt);
      setShowTerms(true);
    } catch (err) {
      toast.error('No se pudieron cargar los términos');
    }
  };
  const closeTerms = () => setShowTerms(false)
  const [termsText, setTermsText] = useState<string>(''); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree) return toast.error('Debes aceptar términos y condiciones')
    setLoading(true)

    const defaultRole = 'GUEST'
    const payload = {
      auth: {
        username,
        email,
        password,
        role: defaultRole      // "GUEST" 
      },
      user: {
        name,
        lastname
        // campos opcionales van aca
      }
    };
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register`, // usa el endpoint que haga await c.req.json<RegisterRequestBody>()
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      //console.log(res);
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null)
        const errorMessage =
          errorPayload?.error || errorPayload?.message || `Error en registro (HTTP ${res.status})`
        throw new Error(errorMessage)
      }

      //AUTLOGIN DESPUÉS DE REGISTRO
      const loginRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials:"include"
      })

      if (!loginRes.ok) throw new Error('Error al iniciar sesión automáticamente')
      //console.log(loginRes);

      const meRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!meRes.ok) toast.error("No se pudo obtener el usuario");
      const userData = await meRes.json();
      const { account } = userData;

      window.dispatchEvent(new Event('authChanged'))
      setTimeout(() => {
        if (account.role === 'GUEST') {
          navigate('/register/form')
        } else {
          navigate('/')
        }
      }, 100) // 100-200ms suele bastar
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Ocurrió un error desconocido')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    
    <div className="auth-background">
      <div className="auth-card">
        {/* ─── LEFT: MEDIA PANEL ─── */}
        <div className="media-panel">
          <video src={`${import.meta.env.VITE_BACKEND_URL_MEDIA}/register.mp4`} autoPlay loop muted />
          <div className="media-overlay">
            <p className="text-xl md:text-2xl font-bold text-white/90 mb-6">Bienvenidos!</p>
            <p className="text-white/80 mb-6">¿Ya tienes una cuenta?</p>
            <Link
              to="/login"
              className="px-6 py-3 border-2 border-white text-white rounded-full hover:bg-white/20 transition font-bold"
            >
              INICIAR SESIÓN
            </Link>
          </div>
        </div>

        {/* ─── RIGHT: REGISTER FORM ─── */}
        <div className="form-panel">
          <h2 className="text-3xl font-bold mb-6">Registrarse</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="bg-gray-100"
              />
            </div>

            {/* Lastname */}
            <div>
              <Label htmlFor="lastname">Apellido</Label>
              <Input
                id="lastname"
                type="text"
                placeholder="Tu apellido"
                value={lastname}
                onChange={e => setLastname(e.target.value)}
                required
                className="bg-gray-100"
              />
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username">Usuario</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-gray-100"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-gray-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Agree  + enlace + modal */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={() => setAgree(x => !x)}
                className="form-checkbox h-4 w-4 text-[var(--brand)]"
              />
              Acepto&nbsp;
              <button
                type="button"
                onClick={openTerms}
                className="text-[var(--brand)] underline hover:text-[var(--brand-light)] focus:outline-none"
              >
                términos y condiciones
              </button>
            </label>

            {/* ───────── Modal ───────── */}
            {showTerms && (
              <div
                /* overlay */
                  className="
                    fixed inset-0 z-50 flex items-center justify-center
                    bg-black/50 backdrop-blur-sm
                  "
                  onClick={closeTerms}
                  onKeyDown={e => e.key === 'Escape' && closeTerms()}
                  tabIndex={-1}
                >

                  <div
                    /* panel */
                    className="
                      relative
                      w-[95%] md:w-[80%] lg:w-[60%]   /* más grande en pantallas grandes */
                      max-w-none                      /* sin tope duro */
                      max-h-[80vh] overflow-y-auto
                      border rounded-none
                      bg-white text-gray-900
                      dark:bg-[#1f1f1f] dark:text-gray-100 dark:border-gray-700
                      p-8 shadow-xl
                    "
                    onClick={e => e.stopPropagation()}
                  >
                  {/* ✕ cerrar */}
                  <button
                    onClick={closeTerms}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4
                              text-gray-400 hover:text-gray-600
                              dark:text-gray-500 dark:hover:text-gray-300
                              transition"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-semibold mb-4">Términos y condiciones</h2>

                  <p className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                    {termsText || 'Cargando…'}
                  </p>

                </div>
                
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-3 bg-[var(--brand)] text-white rounded-full hover:bg-[var(--brand-light)] transition"
              disabled={loading}
            >
              {loading ? 'Registrándose...' : 'Registrarse'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewRegister
