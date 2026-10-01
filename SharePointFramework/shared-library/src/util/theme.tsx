import { BrandVariants, createDarkTheme, createLightTheme } from '@fluentui/react-components'
import pSBC from 'shade-blend-color'

/**
 * SharePoint's default primary colour, used when the page has not published its theme by the time
 * this module loads. The site's own theme is on `window.__themeState__` on every modern page, but
 * an application customizer can load before it is there: a bare read crashed the footer's whole
 * bundle ("Could not load footer-application-customizer in require: Cannot read properties of
 * undefined (reading 'themePrimary')") on a project site in the test tenant.
 */
const DEFAULT_PRIMARY_COLOR = '#0078d4'

const themeColors: Record<string, string> = (window as any).__themeState__?.theme ?? {}
const primaryColor: string = themeColors.themePrimary ?? DEFAULT_PRIMARY_COLOR

const brandVariants: BrandVariants = {
  10: pSBC(-0.5, primaryColor),
  20: pSBC(-0.45, primaryColor),
  30: pSBC(-0.4, primaryColor),
  40: pSBC(-0.35, primaryColor),
  50: pSBC(-0.3, primaryColor),
  60: pSBC(-0.25, primaryColor),
  70: pSBC(-0.2, primaryColor),
  80: pSBC(-0.1, primaryColor),
  90: primaryColor,
  100: pSBC(0.2, primaryColor),
  110: pSBC(0.3, primaryColor),
  120: pSBC(0.4, primaryColor),
  130: pSBC(0.5, primaryColor),
  140: pSBC(0.6, primaryColor),
  150: pSBC(0.7, primaryColor),
  160: pSBC(0.8, primaryColor)
}

export const customLightTheme = createLightTheme(brandVariants)
export const customDarkTheme = createDarkTheme(brandVariants)
export const themeColor = primaryColor
