import { IList } from '@pnp/sp/lists'

export type EnsureProjectDataListParams = {
  /**
   * Title of the list, the same as the hub list it replaces for a shielded project.
   */
  listName: string

  /**
   * List template: `100` for a list, `101` for a document library.
   */
  template: 100 | 101

  /**
   * The hub content type the list's items get, created on the project site with the same ID and
   * fields. Without it, the list keeps the default content type of its template.
   */
  contentTypeId?: string

  /**
   * Names of the project site's groups that get read access to the list, such as the group for
   * insight into shielded projects.
   */
  readerGroupNames?: string[]

  /**
   * Progress function, given the field being added.
   *
   * @param progress Progress text
   */
  progressFunc?: (progress: string) => void
}

export type EnsureProjectDataListResult = {
  /**
   * The list on the project site.
   */
  list: IList

  /**
   * Whether the list was created now.
   */
  created: boolean

  /**
   * The ID of the list's own copy of `contentTypeId`, for the items' `ContentTypeId`.
   */
  listContentTypeId?: string
}
