/* eslint-disable no-console */
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http'
import { stringIsNullOrEmpty } from '@pnp/core'
import { format, isUnauthorizedError } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { TemplateFile } from './types'
import SPDataAdapter from 'data'
import resource from 'SharedResources'
import { getRestErrorMessage, toODataString, toUrlPath } from './rest'

/**
 * The error for a news site the user may not read or write (401, 403), with the status, so
 * `isUnauthorizedError` knows it. The news site is the hub unless `ProjectNewsHubUrl` says
 * otherwise, and a member of «Minimum lesetilganger på hub» does not read the hub's pages.
 */
export function newsNoAccessError(): Error {
  return Object.assign(new Error(strings.NewsNoAccessErrorText), { status: 403 })
}

/**
 * The site the project's news are on: the one the web part names, else the hub's setting
 * `ProjectNewsHubUrl`, else the hub itself, which is the setting's value on a new installation.
 * Empty only when the hub is out of reach, which the news tell as missing access.
 *
 * @param webPartUrl The site the web part names (`siteUrl`)
 * @param settingUrl The hub's setting `ProjectNewsHubUrl`, when it is enabled
 * @param hub Whether the hub is in reach, and its URL
 */
export function getNewsSiteUrl(
  webPartUrl: string | undefined,
  settingUrl: string | undefined,
  hub: { isAvailable: boolean; url?: string }
): string {
  return webPartUrl || settingUrl || (hub.isAvailable ? (hub.url ?? '') : '')
}

/**
 * Whether a response from the news site refused the user.
 *
 * @param response Response
 */
export function isNewsAccessDenied(response: SPHttpClientResponse): boolean {
  return response.status === 401 || response.status === 403
}

// --- SharePoint file name validation constants ---
const invalidChars = /["*:<>?/\\|#%;]/
const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9]|\.lock|desktop\.ini|_vti_|~\$|forms)$/i
const maxFileNameLength = 100

/**
 * Validates a SharePoint file name according to SharePoint rules.
 * @param name The file name to validate (without path)
 * @returns true if valid, otherwise a localized error message string
 */
export function validateSharePointFileName(name: string): true | string {
  if (!name || name.trim().length === 0) {
    return strings.FileNameRequired
  }
  if (name.length > maxFileNameLength) {
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
 * Ensures the existence of the specified news folder in the SitePages library. The folder is
 * looked up and made through the path APIs, which take a name with `#` or `%`.
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
  const folderPath = toODataString(getServerRelativeUrl(siteUrl, 'SitePages', folderName))
  const folderUrl = `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl=${folderPath})?$select=Exists`
  const createFolderUrl = `${siteUrl}/_api/web/folders/addUsingPath(DecodedUrl=${folderPath},overwrite=false)`

  const res = await spHttpClient.get(folderUrl, SPHttpClient.configurations.v1)
  if (isNewsAccessDenied(res)) throw newsNoAccessError()
  // A path API can answer for a folder that is not there with its Exists false, not with a 404.
  if (res.ok && (await res.json().catch(() => ({})))?.Exists === true) return
  if (!res.ok && res.status !== 404) {
    throw new Error(strings.NewsFolderError)
  }

  const createRes = await spHttpClient.post(createFolderUrl, SPHttpClient.configurations.v1, {
    headers: { Accept: 'application/json' }
  })
  if (isNewsAccessDenied(createRes)) throw newsNoAccessError()
  if (!createRes.ok) {
    const error = await createRes.json().catch(() => ({}))
    throw new Error(strings.NewsFolderError + (getRestErrorMessage(error) || createRes.statusText))
  }
}

/**
 * Returns the SharePoint page name for a news article with the given title: the title without
 * the characters a file name cannot have (`#` and `%` among them, which would also break the REST
 * URLs), its spaces as dashes, no longer than a file name may be, and `.aspx` added. The name
 * passes `validateSharePointFileName` unless nothing is left of the title or it is reserved; the
 * page's title keeps the text as written.
 * @param title The title of the news article
 * @returns The generated SharePoint page name
 */
export function getNewsPageName(title: string): string {
  const name = Array.from(title)
    .filter((char) => !invalidChars.test(char))
    .join('')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, maxFileNameLength)
    .replace(/^\.+|\.+$/g, '')
  return `${name}.aspx`
}

/**
 * Returns the edit URL for a SharePoint page representing a news article.
 * @param siteUrl URL of the site containing the news article
 * @param folderName Name of the folder containing the news article page
 * @param pageName Name of the news article page (as generated by `getNewsPageName`)
 * @returns The edit URL for the news article page
 */
export function getNewsEditUrl(siteUrl: string, folderName: string, pageName: string): string {
  const serverRelative = getServerRelativeUrl(siteUrl, 'SitePages', folderName, pageName)
  const origin = new URL(siteUrl).origin
  return `${origin}${toUrlPath(serverRelative)}?Mode=Edit`
}

/**
 * Retrieves site page templates from the 'Maler' folder in the SitePages library,
 * with fallback to 'Templates' folder to support both Norwegian and English standards.
 * @param siteUrl URL of the site to retrieve the templates from
 * @param spHttpClient SPHttpClient to use for the operation
 * @returns Promise that resolves with an array of templates, represented as objects with `Name`, `Title` and `ServerRelativeUrl` properties
 */
export async function getTemplates(
  siteUrl: string,
  spHttpClient: SPHttpClient
): Promise<TemplateFile[]> {
  const filesIn = (folderName: string) =>
    `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl=${toODataString(getServerRelativeUrl(siteUrl, 'SitePages', folderName))})/Files?$select=Name,Title,ServerRelativeUrl`
  // Try Norwegian standard first (Maler)
  const url = filesIn('Maler')
  try {
    const res = await spHttpClient.get(url, SPHttpClient.configurations.v1)
    if (res.ok) {
      const data = await res.json()
      const templates = (data.value || []).map((item: any) => ({
        ...item,
        Title: stringIsNullOrEmpty(item.Title) ? item.Name.replace(/\.aspx$/i, '') : item.Title
      }))

      // If we have templates, return them, otherwise try fallback
      if (templates.length > 0) {
        return templates
      }
    }
  } catch {
    // Ignore error and try fallback
  }

  // Fallback to English standard (Templates)
  const templatesUrl = filesIn('Templates')
  try {
    const res = await spHttpClient.get(templatesUrl, SPHttpClient.configurations.v1)
    const data = await res.json()
    return (data.value || []).map((item: any) => ({
      ...item,
      Title: stringIsNullOrEmpty(item.Title) ? item.Name.replace(/\.aspx$/i, '') : item.Title
    }))
  } catch {
    return []
  }
}

/**
 * Given a SharePoint news item, extracts the URL of the banner image.
 * First looks at the BannerImageUrl field, then tries to extract the first
 * image URL from the CanvasContent1 field (if it's a JSON string).
 * Returns undefined if no image URL can be found.
 * @param item SharePoint news item
 */
export function getNewsImageUrl(item: any): string | undefined {
  if (item.BannerImageUrl?.Url) return item.BannerImageUrl.Url
  if (item.CanvasContent1) {
    try {
      const html = JSON.parse(item.CanvasContent1)
      const match = html.match(/<img[^>]+src="([^">]+)"/)
      if (match && match[1]) return match[1]
    } catch {
      // ignore parse errors
    }
  }
  return undefined
}

/**
 * Checks if a SharePoint site page exists, through the path API.
 *
 * @param siteUrl URL of the SharePoint site
 * @param spHttpClient SPHttpClient instance to perform the HTTP request
 * @param folderName Name of the folder in the SitePages library where the page is located
 * @param fileName File name of the page
 * @returns Promise that resolves with a boolean indicating if the file exists or not.
 */
export async function doesSitePageExist(
  siteUrl: string,
  spHttpClient: SPHttpClient,
  folderName: string,
  fileName: string
): Promise<boolean> {
  const serverRelativeUrl = getServerRelativeUrl(siteUrl, 'SitePages', folderName, fileName)
  const url = `${siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl=${toODataString(serverRelativeUrl)})?$select=Exists`
  const res = await spHttpClient.get(url, SPHttpClient.configurations.v1)
  if (!res.ok) return false
  return (await res.json().catch(() => ({})))?.Exists === true
}

/**
 * Retrieves the list item ID of a SharePoint site page through the page's own file. A filter on
 * the file name found nothing when its request failed (a name with `'`, a library over the list
 * view threshold) and could find a page with the same name in another folder. A failed answer,
 * or one without the item, is asked again, `attempts` times in all, `delay` ms apart.
 *
 * @param siteUrl URL of the SharePoint site
 * @param spHttpClient SPHttpClient instance to use for making the request
 * @param pageServerRelativeUrl Server-relative URL of the page
 * @param attempts How many times to ask before giving up
 * @param delay Milliseconds to wait before asking again
 * @returns Promise that resolves with the item ID and the server-relative URL of the SitePages
 * library, and rejects, with SharePoint's message when it gave one, when the item is not found
 */
export async function getSitePageItemId(
  siteUrl: string,
  spHttpClient: SPHttpClient,
  pageServerRelativeUrl: string,
  attempts = 3,
  delay = 500
): Promise<{ itemId: number; sitePagesServerRelativeUrl: string }> {
  const sitePagesServerRelativeUrl = getServerRelativeUrl(siteUrl, 'SitePages')
  const itemUrl = `${siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl=${toODataString(pageServerRelativeUrl)})/ListItemAllFields?$select=Id`
  let errorMessage: string | undefined
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, delay))
    const res = await spHttpClient.get(itemUrl, SPHttpClient.configurations.v1)
    const data = await res.json().catch(() => ({}))
    if (res.ok && data?.Id) return { itemId: data.Id, sitePagesServerRelativeUrl }
    errorMessage = res.ok ? undefined : getRestErrorMessage(data)
  }
  const pageName = pageServerRelativeUrl.split('/').pop()
  throw new Error(errorMessage || format(strings.NewsPageItemNotFoundError, pageName))
}

/**
 * Copies a template page to a new server-relative URL, through the path APIs, which take a
 * template or folder name with `#` or `%`.
 *
 * @param siteUrl URL of the SharePoint site
 * @param spHttpClient SPHttpClient instance to use for making the request
 * @param selectedTemplate Server-relative URL of the template page to copy
 * @param newPageServerRelativeUrl Server-relative URL to copy the template page to
 * @returns Promise that resolves with the raw response from the REST request
 */
export async function copyTemplatePage(
  siteUrl: string,
  spHttpClient: SPHttpClient,
  selectedTemplate: string,
  newPageServerRelativeUrl: string
): Promise<SPHttpClientResponse> {
  const copyUrl = `${siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl=${toODataString(selectedTemplate)})/copyToUsingPath(DecodedUrl=${toODataString(newPageServerRelativeUrl)},bOverWrite=false)`
  return await spHttpClient.post(copyUrl, SPHttpClient.configurations.v1, {
    headers: { Accept: 'application/json;odata=nometadata' }
  })
}

/**
 * Moves a site page to the site's recycle bin, as a copied news page that could not be tied to
 * the project.
 *
 * @param siteUrl URL of the SharePoint site
 * @param spHttpClient SPHttpClient instance to use for making the request
 * @param serverRelativeUrl Server-relative URL of the page
 * @returns Promise that resolves when the page is in the recycle bin, and rejects when it is not
 */
export async function recycleSitePage(
  siteUrl: string,
  spHttpClient: SPHttpClient,
  serverRelativeUrl: string
): Promise<void> {
  const recycleUrl = `${siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl=${toODataString(serverRelativeUrl)})/recycle`
  const res = await spHttpClient.post(recycleUrl, SPHttpClient.configurations.v1, {
    headers: { Accept: 'application/json;odata=nometadata' }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(getRestErrorMessage(error) || res.statusText)
  }
}

const sitePagesFieldsCache = new Map<string, string[]>()

/**
 * Gets all field names starting with 'Gt' from the site's page library. The library is found by
 * its URL (`SitePages`), not by its title, which follows the site's language (`Områdesider`,
 * `Site Pages`): looked up by title, an English hub's fields were never found. The fields are
 * cached per library; a failed request is not cached, and gives the two fields every page library
 * in Prosjektportalen has.
 * @param siteUrl URL of the SharePoint site
 * @param spHttpClient SPHttpClient instance to use for making the request
 * @returns Promise that resolves with an array of field names starting with 'Gt'
 */
export async function getSitePagesFields(
  siteUrl: string,
  spHttpClient: SPHttpClient
): Promise<string[]> {
  const sitePagesServerRelativeUrl = getServerRelativeUrl(siteUrl, 'SitePages')
  const fieldsUrl = `${siteUrl}/_api/web/GetListUsingPath(DecodedUrl=@a1)/fields?@a1=${toODataString(sitePagesServerRelativeUrl)}&$select=InternalName&$filter=startswith(InternalName,'Gt')`
  const cachedFields = sitePagesFieldsCache.get(fieldsUrl)
  if (cachedFields) {
    return cachedFields
  }

  try {
    const res = await spHttpClient.get(fieldsUrl, SPHttpClient.configurations.v1)

    if (res.ok) {
      const data = await res.json()
      const fields = data.value?.map((field: any) => field.InternalName) || []

      sitePagesFieldsCache.set(fieldsUrl, fields)
      return fields
    }
  } catch (error) {
    console.warn('Error fetching SitePages fields:', error)
  }

  return ['GtSiteId', 'GtHubSiteId']
}

/**
 * Ties a news page to its project: sets the "Original Source Site Id" field (`GtSiteId`) and the
 * hub's ID on the page's item, gives the page the title from the dialog (the copy has the
 * template's), and copies the project's values for the `Gt` fields that both the page library
 * and the hub's project list have.
 * @param siteUrl URL of the SharePoint site where the page is stored
 * @param spHttpClient SPHttpClient instance to use for making the request
 * @param sitePagesServerRelativeUrl Server-relative URL of the SitePages library
 * @param itemId ID of the list item representing the page
 * @param siteId The ID of the source site to set in the OriginalSourceSiteId field
 * @param hubSiteId The ID of the hub site the project belongs to
 * @param title The title of the news article, as written in the dialog
 * @returns Promise that resolves when the fields have been set
 */
export async function setOriginalSourceSiteId(
  siteUrl: string,
  spHttpClient: SPHttpClient,
  sitePagesServerRelativeUrl: string,
  itemId: number,
  siteId: string,
  hubSiteId: string,
  title: string
): Promise<void> {
  if (!siteId) {
    throw new Error('Site ID is required to set GtSiteId')
  }

  const fields = await getSitePagesFields(siteUrl, spHttpClient)

  const updateBody: any = {
    GtSiteId: siteId,
    GtHubSiteId: hubSiteId
  }
  // The longest value a single line of text holds.
  const pageTitle = (title ?? '').trim().slice(0, 255)
  if (pageTitle) {
    updateBody.Title = pageTitle
  }

  const pageFields = fields.filter((field) => !['GtSiteId', 'GtHubSiteId'].includes(field))
  // The page is made by now: a hub that does not let the user read `Prosjekter` (a member of
  // «Minimum lesetilganger på hub») leaves it with the site and hub ids, rather than failing it.
  try {
    const projectsList = SPDataAdapter.portalDataService.web.lists.getByTitle(
      resource.Lists_Projects_Title
    )
    // The page library can have Gt fields the project list lacks (a test hub's GtHubUrl), and
    // selecting one of them fails the whole query with a 400: copy only what both lists have.
    const projectListFields: { InternalName: string }[] =
      pageFields.length > 0
        ? await projectsList.fields.select('InternalName').filter("startswith(InternalName,'Gt')")()
        : []
    const projectFields = pageFields.filter((field) =>
      projectListFields.some(({ InternalName }) => InternalName === field)
    )

    if (projectFields.length > 0) {
      const [projectData] = await projectsList.items
        .select(...projectFields)
        .filter(`GtSiteId eq '${siteId}'`)
        .top(1)()

      if (projectData) {
        for (const field of projectFields) {
          if (projectData[field] !== undefined && projectData[field] !== null) {
            updateBody[field] = projectData[field]
          }
        }
      } else {
        console.warn(`No project data found for site ID: ${siteId}`)
      }
    }
  } catch (error) {
    // Only a refusal is passed over. Another failure would leave the article without the
    // project's values: the dialog then removes the page and says why.
    if (!isUnauthorizedError(error)) throw error
    console.warn('Could not read the project from the hub for the news article:', error)
  }

  const updateUrl = `${siteUrl}/_api/web/GetListUsingPath(DecodedUrl=${toODataString(sitePagesServerRelativeUrl)})/items(${itemId})`
  const updateRes = await spHttpClient.post(updateUrl, SPHttpClient.configurations.v1, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE'
    },
    body: JSON.stringify(updateBody)
  })

  if (!updateRes.ok) {
    const error = await updateRes.json().catch(() => ({}))
    // With the status, a refused update says access is missing.
    throw Object.assign(new Error(getRestErrorMessage(error) || updateRes.statusText), {
      status: updateRes.status
    })
  }
}
