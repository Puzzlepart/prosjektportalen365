import { useState } from 'react'

/**
 * Tracks drawer visibility, first opening and iframe loading without resetting on close.
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
