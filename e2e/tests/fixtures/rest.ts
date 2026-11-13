import { Page } from '@playwright/test'
import { REQUEST_TIMEOUT, withNetworkRetry, withSessionRenewal } from './pp365'

/**
 * Writes through SharePoint's REST API with the signed-in session, for the flows' clean-up: what
 * a flow creates must not survive the run, and a half-done run must not leave anything behind.
 */
const JSON_HEADERS = { Accept: 'application/json;odata=nometadata' }

/**
 * A REST read with the signed-in session: bounded, sent again after a network failure, and once
 * more after renewing a session SharePoint no longer accepts.
 */
export function restGet(page: Page, url: string) {
  return withSessionRenewal(page, url, () =>
    withNetworkRetry(() =>
      page.request.get(url, { headers: JSON_HEADERS, timeout: REQUEST_TIMEOUT })
    )
  )
}

/**
 * A REST write (SharePoint's deletes are POSTs with a method header): bounded, but sent once after
 * a network failure. A write whose connection stalled may still have been applied, and a second
 * delete would be a 404. A write refused as signed out was not applied, so it is sent once more
 * after the session is renewed.
 */
export function restPost(page: Page, url: string, headers: Record<string, string> = {}) {
  return withSessionRenewal(page, url, () =>
    page.request.post(url, {
      headers: { ...JSON_HEADERS, ...headers },
      timeout: REQUEST_TIMEOUT
    })
  )
}

/** A request digest for the site, which every write needs. Idempotent, so retried like a read. */
export async function requestDigest(page: Page, siteUrl: string) {
  const response = await withNetworkRetry(() => restPost(page, `${siteUrl}/_api/contextinfo`))
  if (!response.ok()) throw new Error(`No request digest for ${siteUrl}: HTTP ${response.status()}`)
  return ((await response.json()) as { FormDigestValue: string }).FormDigestValue
}

/** The signed-in user's id on the site. */
export async function currentUserId(page: Page, siteUrl: string) {
  const response = await restGet(page, `${siteUrl}/_api/web/currentuser?$select=Id`)
  return ((await response.json()) as { Id: number }).Id
}

/** The site's id, as the hub's lists refer to it. */
export async function siteId(page: Page, siteUrl: string) {
  const response = await restGet(page, `${siteUrl}/_api/site?$select=Id`)
  return ((await response.json()) as { Id: string }).Id
}

/** A list of a site, as `listWithField` finds it. */
export interface IList {
  id: string
  title: string
  url: string
}

/**
 * The first list of a site that has a field, preferring the titles given: how a project's risk
 * list and the hub's settings list are found, whatever a tenant named them. The settings list is
 * hidden (the template hides it from the site contents), so hidden lists are searched when asked
 * for.
 */
export async function listWithField(
  page: Page,
  siteUrl: string,
  internalName: string,
  preferred: RegExp,
  includeHidden = false
): Promise<IList | undefined> {
  const filter = includeHidden ? 'BaseTemplate eq 100' : 'BaseTemplate eq 100 and Hidden eq false'
  const response = await restGet(
    page,
    `${siteUrl}/_api/web/lists?$filter=${filter}&$select=Id,Title,DefaultViewUrl&$top=200`
  )
  if (!response.ok())
    throw new Error(`Could not list the lists of ${siteUrl}: HTTP ${response.status()}`)
  const lists = ((await response.json()) as { value: Record<string, string>[] }).value
  lists.sort((a, b) => Number(preferred.test(b.Title)) - Number(preferred.test(a.Title)))
  for (const list of lists) {
    if (await hasField(page, siteUrl, list.Id, internalName)) {
      return {
        id: list.Id,
        title: list.Title,
        url: `${new URL(siteUrl).origin}${list.DefaultViewUrl}`
      }
    }
  }
  return undefined
}

/** Whether a list has a field, by internal name. */
export async function hasField(
  page: Page,
  siteUrl: string,
  listId: string,
  internalName: string
): Promise<boolean> {
  const response = await restGet(
    page,
    `${siteUrl}/_api/web/lists(guid'${listId}')/fields?$filter=InternalName eq '${internalName}'&$select=InternalName`
  )
  return response.ok() && ((await response.json()) as { value: unknown[] }).value.length > 0
}

/**
 * The hub's global settings as PP365's code reads them (`PortalDataService.getGlobalSettings`):
 * the enabled rows, by their exact key, a key on two rows taking the one read last. The rows are
 * read in full and matched here: a `$filter` on the key would also return disabled rows, which the
 * code never reads. Empty when the hub has no settings list.
 *
 * @param page The test's page
 * @param hubUrl The hub's URL
 */
export async function hubSettings(page: Page, hubUrl: string): Promise<Map<string, string>> {
  const settings = new Map<string, string>()
  const list = await listWithField(page, hubUrl, 'GtSettingsKey', /innstillinger|settings/i, true)
  if (!list) return settings
  const response = await restGet(
    page,
    `${hubUrl}/_api/web/lists(guid'${list.id}')/items?$select=Id,GtSettingsKey,GtSettingsValue,GtSettingsEnabled&$orderby=Id&$top=500`
  )
  if (!response.ok())
    throw new Error(`Could not read the hub's settings (${list.title}): HTTP ${response.status()}`)
  const rows = (
    (await response.json()) as {
      value: { GtSettingsKey: string; GtSettingsValue: string; GtSettingsEnabled: boolean }[]
    }
  ).value
  for (const row of rows) {
    if (row.GtSettingsEnabled && row.GtSettingsKey)
      settings.set(row.GtSettingsKey, row.GtSettingsValue)
  }
  return settings
}

/**
 * The value of a setting in the hub's global settings, as PP365's code reads it (`hubSettings`),
 * or `undefined` when no enabled row has the key.
 */
export async function hubSetting(
  page: Page,
  hubUrl: string,
  key: string
): Promise<string | undefined> {
  return (await hubSettings(page, hubUrl)).get(key)
}

/** The headers of a delete: the digest, and the method SharePoint reads from a POST. */
async function deleteHeaders(page: Page, siteUrl: string) {
  return {
    'X-RequestDigest': await requestDigest(page, siteUrl),
    'X-HTTP-Method': 'DELETE',
    'IF-MATCH': '*'
  }
}

/** Deletes a list item. */
export async function deleteItem(page: Page, siteUrl: string, listTitle: string, itemId: number) {
  const response = await restPost(
    page,
    `${siteUrl}/_api/web/lists/getbytitle('${listTitle}')/items(${itemId})`,
    await deleteHeaders(page, siteUrl)
  )
  if (!response.ok())
    throw new Error(`Could not delete item ${itemId} in ${listTitle}: HTTP ${response.status()}`)
}

/** Deletes a file by its server-relative path. */
export async function deleteFile(page: Page, siteUrl: string, serverRelativePath: string) {
  const response = await restPost(
    page,
    `${siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl='${encodeURIComponent(serverRelativePath)}')`,
    await deleteHeaders(page, siteUrl)
  )
  if (!response.ok())
    throw new Error(`Could not delete ${serverRelativePath}: HTTP ${response.status()}`)
}

/** The files in a folder whose name starts with a prefix. */
export async function filesWithPrefix(
  page: Page,
  siteUrl: string,
  folderServerRelativePath: string,
  prefix: string
) {
  const response = await restGet(
    page,
    `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${encodeURIComponent(folderServerRelativePath)}')/Files?$select=Name,ServerRelativeUrl&$filter=startswith(Name,'${prefix}')`
  )
  if (!response.ok())
    throw new Error(`Could not list ${folderServerRelativePath}: HTTP ${response.status()}`)
  return ((await response.json()) as { value: { Name: string; ServerRelativeUrl: string }[] }).value
}

/** The names of a folder's subfolders, without the "Forms" folder every library has. */
export async function subfolders(page: Page, siteUrl: string, folderServerRelativePath: string) {
  const response = await restGet(
    page,
    `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${encodeURIComponent(folderServerRelativePath)}')/Folders?$select=Name&$top=500`
  )
  if (!response.ok())
    throw new Error(`Could not list ${folderServerRelativePath}: HTTP ${response.status()}`)
  return ((await response.json()) as { value: { Name: string }[] }).value
    .map((f) => f.Name)
    .filter((name) => name !== 'Forms')
}

/** Creates a subfolder unless it exists. True when this call created it, so the caller knows to remove it. */
export async function ensureFolder(
  page: Page,
  siteUrl: string,
  parentServerRelativePath: string,
  name: string
) {
  if ((await subfolders(page, siteUrl, parentServerRelativePath)).includes(name)) return false
  const response = await restPost(
    page,
    `${siteUrl}/_api/web/folders/add('${encodeURIComponent(`${parentServerRelativePath}/${name}`)}')`,
    { 'X-RequestDigest': await requestDigest(page, siteUrl) }
  )
  if (!response.ok())
    throw new Error(
      `Could not create ${parentServerRelativePath}/${name}: HTTP ${response.status()} ${await response.text()}`
    )
  return true
}

/** Deletes a folder by its server-relative path. */
export async function deleteFolder(page: Page, siteUrl: string, serverRelativePath: string) {
  const response = await restPost(
    page,
    `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${encodeURIComponent(serverRelativePath)}')`,
    await deleteHeaders(page, siteUrl)
  )
  if (!response.ok())
    throw new Error(`Could not delete ${serverRelativePath}: HTTP ${response.status()}`)
}
