import { sp } from '@pnp/sp'

/**
 * Get welcomepage of the web
 */
export const getWelcomePage = async () => {
  try {
    const welcomepage = await sp.web.rootFolder.select('welcomepage').get()
    
    return welcomepage.WelcomePage
  } catch (error) {
    throw error
  }
}
