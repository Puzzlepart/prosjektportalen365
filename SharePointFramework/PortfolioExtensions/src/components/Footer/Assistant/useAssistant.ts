import { useState } from 'react'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'

/**
 * Tracks drawer visibility, first opening and iframe loading without resetting on close.
 */
export function useAssistant() {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [loading, setLoading] = useState(true)
  const telemetry = useTelemetry()

  function setDrawerOpen(nextOpen: boolean): void {
    // Counted when the drawer goes from closed to open: only that it was opened, nothing of
    // what is asked in it.
    if (nextOpen && !open) telemetry.track('assistant.opened')
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
