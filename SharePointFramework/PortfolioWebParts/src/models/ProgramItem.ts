import { Web } from '@pnp/sp'

interface IProgramSPItem {
  Title: string
  GtSiteUrl: string
  GtChildProjects: string
  [key: string]: any
}

export class ProgramItem {
  public name: string
  public url: string

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private _item: IProgramSPItem, _web?: Web) {
    this.name = _item.Title
    this.url = _item.GtSiteUrl
  }

  /**
   * Get the child project URLs for this program.
   */
  public get children(): string[] {
    try {
      return JSON.parse(this._item.GtChildProjects).map((c: { SPWebURL: string }) => c.SPWebURL)
    } catch (e) {
      return []
    }
  }
}
