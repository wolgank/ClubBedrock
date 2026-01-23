import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const Register: React.FC = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree) return toast.error('Debes aceptar términos y condiciones')
    setLoading(true)

    const defaultRole = 'GUEST'

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/simpleRegister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role: defaultRole })
      })

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null)
        const errorMessage = errorPayload?.error || `HTTP ${res.status}`
        throw new Error(errorMessage)
      }     


      //AUTLOGIN DESPUÉS DE REGISTRO
      const loginRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!loginRes.ok) throw new Error('Error al iniciar sesión automáticamente')

      const data = await loginRes.json()
      window.dispatchEvent(new Event('authChanged'))

      // Redirección según rol
      if (data.account.role === 'GUEST') {
        navigate('/register/form')
      } else {
        navigate('/')
      }
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
          <h2 className="text-3xl font-bold text-[var(--text-light)] mb-6">Registrarse</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <Label htmlFor="username">Usuario</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu nombre"
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

            
            {/* Agree */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={() => setAgree(x => !x)}
                className="form-checkbox h-4 w-4 text-[var(--brand)]"
              />
              Acepto los términos y condiciones
            </label>

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

export default Register
