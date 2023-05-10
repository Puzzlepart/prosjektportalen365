import { Web } from '@pnp/sp'

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
   */
  public buildQueries(
    queryTemplate: string,
    maxQueryLength: number = 2500,
    maxProjects: number = 25
  ): string[] {
    const queryArray: string[] = []
    let queryString = ''
    if (this._children.length > maxProjects) {
      this._children.forEach((c, index) => {
        queryString += `GtSiteIdOWSTEXT:${c} `
        if (queryString.length > maxQueryLength) {
          queryArray.push(`${queryTemplate} (${queryString})`)
          queryString = ''
        }
        if (index === this._children.length - 1) {
          queryArray.push(`${queryTemplate} (${queryString})`)
        }
      })
    } else {
      queryString = this._children.reduce((str, c) => {
        return `${str} GtSiteIdOWSTEXT:${c} `
      }, queryString)
      queryArray.push(queryString)
    }
    return queryArray
  }

  /**
   * Get the child project site IDs for this program.
   */
  private get _children(): string[] {
    try {
      return JSON.parse(this._item.GtChildProjects).map(
        (c: { SPWebURL: string; SiteId: string }) => c.SiteId
      )
    } catch (e) {
      return []
    }
  }
}
