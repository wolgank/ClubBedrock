import React, { useContext } from 'react'
import { ThemeContext } from './theme-provider'

export function ModeToggle() {
  const { theme, setTheme } = useContext(ThemeContext)

  // Elige icono y clase de fondo según el tema
  const isDark = theme === 'dark'
  const icon  = isDark ? '🌞' : '🌙'
  const bg    = isDark ? 'bg-[#FFE082]' : 'bg-[#333333]'
  const color = isDark ? 'text-[#333]'     : 'text-[#FFE082]'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`p-2 rounded-full ${bg} ${color} transition`}
      style={{ fontSize: '1.25rem' }}
    >
      {icon}
    </button>
  )
}
