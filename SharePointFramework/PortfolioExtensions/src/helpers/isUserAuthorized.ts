import { SPFI } from '@pnp/sp'

/**
 * Checks whether the current user's email matches a member of the named SharePoint group.
 */
export async function isUserAuthorized(
  sp: SPFI,
  siteGroup: string,
  context: any
): Promise<boolean> {
  const users = await sp.web.siteGroups.getByName(siteGroup).users()
  return users.some((user: { Email: string }) => user.Email === context.pageContext.user.email)
}
