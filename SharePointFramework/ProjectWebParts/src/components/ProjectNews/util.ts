import { SPHttpClient } from '@microsoft/sp-http'
import * as strings from 'ProjectWebPartsStrings'

// --- SharePoint file name validation constants ---
const invalidChars = /["*:<>?/\\|#%;]/g
const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9]|\.lock|desktop\.ini|_vti_|~\$|forms)$/i

/**
 * Validates a SharePoint file name according to SharePoint rules.
 * @param name The file name to validate (without path)
 * @returns true if valid, otherwise a localized error message string
 */
export function validateSharePointFileName(name: string): true | string {
  if (!name || name.trim().length === 0) {
    return strings.FileNameRequired
  }
  if (name.length > 100) {
    return strings.FileNameTooLong
  }
  if (invalidChars.test(name)) {
    return strings.FileNameInvalid
  }
  if (/^[. ]+|[. ]+$/.test(name)) {
    return strings.FileNameNoLeadingTrailingSpaces
  }
  if (reservedNames.test(name)) {
    return strings.FileNameReserved
  }
  return true
}

/**
 * Returns a server-relative URL by stripping the domain from siteUrl and joining with additional parts.
 * @param siteUrl The absolute site URL (e.g. https://tenant.sharepoint.com/sites/yoursite)
 * @param parts Additional path parts (e.g. 'SitePages', 'Project News', 'MyPage.aspx')
 * @returns The server-relative URL
 */
export function getServerRelativeUrl(siteUrl: string, ...parts: string[]): string {
  const sitePrefix = siteUrl.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '')
  return [sitePrefix, ...parts].join('/').replace(/\/{2,}/g, '/')
}

/**
 * Ensures the existence of the specified news folder in the SitePages library.
 *
 * @param siteUrl URL of the site to check/create the folder in
 * @param spHttpClient SPHttpClient to use for the operation
 * @param folderName Name of the folder to ensure (default: 'Project News')
 * @returns Promise that resolves when the folder has been created or already exists
 */
export async function ensureProjectNewsFolder(
  siteUrl: string,
  spHttpClient: SPHttpClient,
  folderName: string
) {
  const folderServerRelativeUrl = getServerRelativeUrl(siteUrl, 'SitePages', folderName)
  const folderUrl = `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderServerRelativeUrl}')`
  const createFolderUrl = `${siteUrl}/_api/web/folders`

  const res = await spHttpClient.get(folderUrl, SPHttpClient.configurations.v1)
  if (res.ok) return

  if (res.status === 404) {
    const createRes = await spHttpClient.post(createFolderUrl, SPHttpClient.configurations.v1, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ServerRelativeUrl: folderServerRelativeUrl
      })
    })
    if (!createRes.ok) {
      const error = await createRes.json()
      throw new Error(
        strings.NewsFolderError + (error.error?.message?.value || createRes.statusText)
      )
    }
  } else {
    throw new Error(strings.NewsFolderError)
  }
}
