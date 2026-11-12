import { IWeb } from '@pnp/sp/webs'
import { tryParseJson } from 'pp365-shared-library'

interface IProgramSPItem {
  Title: string
  GtSiteUrl: string
  GtChildProjects: string
  [key: string]: any
}

/** Program identity and search-query scoping to its child projects. */
export class ProgramItem {
  public id: string
  public name: string
  public url: string

  constructor(
    private _item: IProgramSPItem,
    _web?: IWeb
  ) {
    this.id = _item.GtSiteId
    this.name = _item.Title
    this.url = _item.GtSiteUrl
  }

  /**
   * Scope a query to child projects, splitting larger programs to limit query length.
   *
   * @param maxQueryLength Child-project clause length after which a batch is emitted;
   * the query template and the final appended project can make the full query longer.
   * @param maxProjects Split only when the program has more than this many projects.
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
