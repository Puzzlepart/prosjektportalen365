import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'

/**
 * The error a section's data fetch fails with: the list the section read, and whether that list
 * exists on the project's site.
 */
export interface ISectionDataError extends Error {
  /**
   * The list the section read, with the report series' scope tokens replaced
   * (`Usikkerhet DP1` for `Usikkerhet {scope}`)
   */
  listTitle: string

  /**
   * SharePoint answered 404: the list does not exist on the project's site
   */
  listNotFound: boolean

  /**
   * The error SharePoint or PnPjs threw
   */
  cause: unknown
}

/**
 * Wraps an error from reading a section's list with the list's title, so the section can name a
 * list that does not exist on the site.
 *
 * @param error The error SharePoint or PnPjs threw
 * @param listTitle The list the section read, with its scope tokens replaced
 */
export function toSectionDataError(error: any, listTitle: string): ISectionDataError {
  return Object.assign(new Error(error?.message), {
    listTitle,
    listNotFound: error?.status === 404,
    cause: error
  })
}

/**
 * The message a section shows when its data could not be fetched. A list that does not exist on
 * the site is named, as a report series' own list (`Prosjektleveranser DP1`) often is; any other
 * error asks whether the section is configured correctly.
 *
 * @param error The error the section's data fetch failed with
 */
export function getSectionDataErrorMessage(error: Partial<ISectionDataError>): string {
  return error?.listNotFound && error.listTitle
    ? format(strings.ListSectionListNotFoundMessage, error.listTitle)
    : strings.ListSectionDataErrorMessage
}
