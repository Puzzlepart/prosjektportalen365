import { Page } from '@playwright/test'
import { REQUEST_TIMEOUT, withNetworkRetry } from './pp365'

/**
 * Writes through SharePoint's REST API with the signed-in session, for the flows' clean-up: what
 * a flow creates must not survive the run, and a half-done run must not leave anything behind.
 */
const JSON_HEADERS = { Accept: 'application/json;odata=nometadata' }

/** A REST read with the signed-in session: bounded, and sent again after a network failure. */
export function restGet(page: Page, url: string) {
  return withNetworkRetry(() =>
    page.request.get(url, { headers: JSON_HEADERS, timeout: REQUEST_TIMEOUT })
  )
}

/**
 * A REST write (SharePoint's deletes are POSTs with a method header): bounded, but sent once. A
 * write whose connection stalled may still have been applied, and a second delete would be a 404.
 */
export function restPost(page: Page, url: string, headers: Record<string, string> = {}) {
  return page.request.post(url, {
    headers: { ...JSON_HEADERS, ...headers },
    timeout: REQUEST_TIMEOUT
  })
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
