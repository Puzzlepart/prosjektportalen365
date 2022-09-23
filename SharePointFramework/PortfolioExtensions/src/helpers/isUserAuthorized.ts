import { SPFI } from '@pnp/sp'

/**
 * Checks if the current user has premisions to access the component
 *
 * @param {SPFI} sp SharePoint Factory Interface
 * @param {string} siteGroup SharePoint Factory Interface
 */
export async function isUserAuthorized(sp: SPFI, siteGroup: string): Promise<boolean> {
  const users = await sp.web.siteGroups.getByName(siteGroup).users()
  return users.some(
    (user: { Email: string }) => user.Email === this.context.pageContext.user.email
  )
}
