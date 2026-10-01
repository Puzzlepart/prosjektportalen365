import { Page } from '@playwright/test'

/**
 * Writes through SharePoint's REST API with the signed-in session, for the flows' clean-up: what
 * a flow creates must not survive the run, and a half-done run must not leave anything behind.
 */
const JSON_HEADERS = { Accept: 'application/json;odata=nometadata' }

/** A request digest for the site, which every write needs. */
export async function requestDigest(page: Page, siteUrl: string) {
  const response = await page.request.post(`${siteUrl}/_api/contextinfo`, { headers: JSON_HEADERS })
  if (!response.ok()) throw new Error(`No request digest for ${siteUrl}: HTTP ${response.status()}`)
  return ((await response.json()) as { FormDigestValue: string }).FormDigestValue
}

/** The signed-in user's id on the site. */
export async function currentUserId(page: Page, siteUrl: string) {
  const response = await page.request.get(`${siteUrl}/_api/web/currentuser?$select=Id`, {
    headers: JSON_HEADERS
  })
  return ((await response.json()) as { Id: number }).Id
}

/** The site's id, as the hub's lists refer to it. */
export async function siteId(page: Page, siteUrl: string) {
  const response = await page.request.get(`${siteUrl}/_api/site?$select=Id`, {
    headers: JSON_HEADERS
  })
  return ((await response.json()) as { Id: string }).Id
}

/** Deletes a list item. */
export async function deleteItem(page: Page, siteUrl: string, listTitle: string, itemId: number) {
  const response = await page.request.post(
    `${siteUrl}/_api/web/lists/getbytitle('${listTitle}')/items(${itemId})`,
    {
      headers: {
        ...JSON_HEADERS,
        'X-RequestDigest': await requestDigest(page, siteUrl),
        'X-HTTP-Method': 'DELETE',
        'IF-MATCH': '*'
      }
    }
  )
  if (!response.ok())
    throw new Error(`Could not delete item ${itemId} in ${listTitle}: HTTP ${response.status()}`)
}

/** Deletes a file by its server-relative path. */
export async function deleteFile(page: Page, siteUrl: string, serverRelativePath: string) {
  const response = await page.request.post(
    `${siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl='${encodeURIComponent(serverRelativePath)}')`,
    {
      headers: {
        ...JSON_HEADERS,
        'X-RequestDigest': await requestDigest(page, siteUrl),
        'X-HTTP-Method': 'DELETE',
        'IF-MATCH': '*'
      }
    }
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
  const response = await page.request.get(
    `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${encodeURIComponent(folderServerRelativePath)}')/Files?$select=Name,ServerRelativeUrl&$filter=startswith(Name,'${prefix}')`,
    { headers: JSON_HEADERS }
  )
  if (!response.ok())
    throw new Error(`Could not list ${folderServerRelativePath}: HTTP ${response.status()}`)
  return ((await response.json()) as { value: { Name: string; ServerRelativeUrl: string }[] }).value
}
