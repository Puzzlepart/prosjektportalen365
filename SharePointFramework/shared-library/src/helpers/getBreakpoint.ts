const BREAKPOINTS = {
  sm: [320, 479],
  md: [480, 639],
  lg: [640, 1023],
  xl: [1024, 1365],
  xxl: [1366, 1919],
  xxxl: [1920, 4000]
}

export function getBreakpoint(): string {
  const windowWidth = window.innerWidth
  const [breakpoint] = Object.keys(BREAKPOINTS).filter((key) => {
    const [f, t] = BREAKPOINTS[key]
    if (windowWidth < f) {
      return false
    }
    if (t) {
      return windowWidth <= t
    }
    return true
  })
  return breakpoint
}
