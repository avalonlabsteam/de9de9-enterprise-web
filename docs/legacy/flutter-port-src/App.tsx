import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { applyTheme, useThemeStore } from '@/stores/themeStore'

export default function App() {
  const mode = useThemeStore((s) => s.mode)

  // Keep the <html> theme class in sync with the store.
  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  return <RouterProvider router={router} />
}
