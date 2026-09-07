import { useState } from 'react'

/**
 * Component logic hook for the `Assistant` component.
 */
export function useAssistant() {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [loading, setLoading] = useState(true)

  function setDrawerOpen(nextOpen: boolean): void {
    setOpen(nextOpen)
    if (nextOpen) setHasOpened(true)
  }

  return {
    open,
    hasOpened,
    loading,
    close: () => setDrawerOpen(false),
    toggle: () => setDrawerOpen(!open),
    setDrawerOpen,
    setLoading
  } as const
}
