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
   * Get the child project site IDs for this program.
   */
  public get children(): string[] {
    try {
      return JSON.parse(this._item.GtChildProjects).map(
        (c: { SPWebURL: string; SiteId: string }) => c.SiteId
      )
    } catch (e) {
      return []
    }
  }

  /**
   * Get search query filters for this program.
   *
   * @param propertyName Property name to refine/filter on
   */
  public getSearchQueryFilters(propertyName = 'GtSiteIdOWSTEXT'): string {
    return `(${this.children.map((c) => `${propertyName}:${c}`).join(' OR ')})`
  }
}
