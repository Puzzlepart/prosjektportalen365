import { sp } from '@pnp/sp'

/**
 * Get welcomepage of the web
 */
export const getWelcomePage = async () => {
  try {
    let welcomepage = await sp.web.rootFolder.select('welcomepage').get()
    
    return welcomepage
  } catch (error) {
    throw error
  }
}
