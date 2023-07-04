import { Web } from '@pnp/sp'
import { tryParseJson } from 'pp365-shared-library'

interface IProgramSPItem {
  Title: string
  GtSiteUrl: string
  GtChildProjects: string
  [key: string]: any
}

export class ProgramItem {
  public id: string
  public name: string
  public url: string

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private _item: IProgramSPItem, _web?: Web) {
    this.id = _item.GtSiteId
    this.name = _item.Title
    this.url = _item.GtSiteUrl
  }

  /**
   * Create queries if number of projects exceeds threshold to avoid 4096 character limitation by SharePoint
   *
   * @param queryTemplate Query template to be used as the base
   * @param maxQueryLength Maximum length of query before pushing to array
   * @param maxProjects Maximum projects required before creating strings
   * @param fieldName Name of the field to search for
   */
  public buildQueries(
    queryTemplate: string,
    maxQueryLength: number = 2500,
    maxProjects: number = 25,
    fieldName: string = 'GtSiteIdOWSTEXT'
  ): string[] {
    const queryArray: string[] = []
    let queryString = ''
    if (this._children.length > maxProjects) {
      this._children.forEach((c, index) => {
        queryString += `${fieldName}:${c} `
        if (queryString.length > maxQueryLength) {
          queryArray.push(`${queryTemplate} (${queryString.trim()})`)
          queryString = ''
        }
        if (index === this._children.length - 1) {
          queryArray.push(`${queryTemplate} (${queryString.trim()})`)
        }
      })
    } else {
      queryString = this._children.map((c) => `${fieldName}:${c}`).join(' ')
      queryArray.push(`${queryTemplate} (${queryString.trim()})`)
    }
    return queryArray
  }

  /**
   * Get the child project site IDs for this program.
   */
  private get _children(): string[] {
    return tryParseJson<{ SPWebURL: string; SiteId: string }[]>(this._item.GtChildProjects, []).map(
      (c) => c.SiteId
    )
  }
}
