import { CSSProperties } from 'react'

/**
 * Component logic hook for `ProjectCardHeader`
 */
export function useProjectCardHeader() {
  return {
    getPhaseStyle: () =>
      ({ backgroundColor: '#808080', opacity: 0.9, color: 'white' } as CSSProperties)
  } as const
}
