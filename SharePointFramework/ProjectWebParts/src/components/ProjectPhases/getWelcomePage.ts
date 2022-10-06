import { sp } from '@pnp/sp'

/**
 * Get welcome page of the web
 */
export const getWelcomePage = async () => {
  try {
    const { WelcomePage } = await sp.web.rootFolder.select('welcomepage').get()
    return WelcomePage
  } catch (error) {
    throw error
  }
}
