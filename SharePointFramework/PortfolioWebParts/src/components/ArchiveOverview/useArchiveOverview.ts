import { customLightTheme } from 'pp365-shared-library'
import { useState } from 'react'
import { IArchiveOverviewProps } from './types'
import { useArchiveData } from './useArchiveData'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scaleThemeFonts(theme: any, factor: number): any {
  const scaled: Record<string, string> = {}
  for (const key of Object.keys(theme)) {
    const val: unknown = theme[key]
    if (
      (key.startsWith('fontSize') || key.startsWith('lineHeight')) &&
      typeof val === 'string' &&
      val.endsWith('px')
    ) {
      scaled[key] = `${Math.round(parseFloat(val) * factor)}px`
    }
  }
  return { ...theme, ...scaled }
}

export const scaledTheme = scaleThemeFonts(customLightTheme, 1.3)

// ─────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────

export function useArchiveOverview(props: IArchiveOverviewProps) {
  const [selectedNav, setSelectedNav] = useState<string>('oversikt')
  const archiveData = useArchiveData(props)

  return {
    selectedNav,
    setSelectedNav,
    ...archiveData
  }
}
