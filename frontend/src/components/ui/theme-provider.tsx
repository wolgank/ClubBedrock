import React, {
  createContext,
  ReactNode,
  useEffect,
  useState,
} from 'react'

interface ThemeContextProps {
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
})

export function ThemeProvider({
  defaultTheme,
  storageKey,
  children,
}: {
  defaultTheme: 'light' | 'dark'
  storageKey: string
  children: ReactNode
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // lee de localStorage o usa default
    const stored = localStorage.getItem(storageKey)
    return stored === 'light' || stored === 'dark'
      ? (stored as 'light' | 'dark')
      : defaultTheme
  })

  useEffect(() => {
    document.documentElement.classList.remove(theme === 'dark' ? 'light' : 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
