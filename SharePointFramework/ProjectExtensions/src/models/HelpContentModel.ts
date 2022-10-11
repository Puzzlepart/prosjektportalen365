import { Web } from '@pnp/sp'
import { TypedHash } from '@pnp/common'

/**
 * @model HelpContentModel
 */
export class HelpContentModel {
  public title: string
  public iconName: string
  public urlPattern: string
  public textContent: string
  public markdownContent: string
  public resourceLink: { Url: string; Description: string }
  public resourceLinkIcon: string
  public externalUrl: string

  constructor(spItem: TypedHash<any>, public web: Web) {
    this.title = spItem.Title
    this.iconName = spItem.GtIconName
    this.urlPattern = spItem.GtURL
    this.textContent = spItem.GtTextContent
    this.resourceLink = spItem.GtResourceLink
    this.resourceLinkIcon = spItem.GtResourceLinkIcon ?? 'Page'
    this.externalUrl = spItem.GtExternalURL
  }

  /**
   * Checks if the help content matches the specified URL
   *
   * @param url Url
   */
  public matchPattern(url: string): boolean {
    return decodeURIComponent(url).indexOf(this.urlPattern) !== -1
  }

  /**
   * Fetch external content
   */
  public async fetchExternalContent() {
    try {
      const md = await (await fetch(this.externalUrl, { method: 'GET' })).text()
      this.markdownContent = this._removeJekyllHeader(md)
    } catch (error) {}
  }

  /**
   * Removed Jekyll header data using regex
   * 
   * @see https://regex101.com/r/dvc3qc/1
   * 
   * @param md Markdown content
   */
  private _removeJekyllHeader(md: string) {
    return md.replace(/^\-\-\-([\n\w\W\s]+)\-\-\-$/mg, '')
  }
}
