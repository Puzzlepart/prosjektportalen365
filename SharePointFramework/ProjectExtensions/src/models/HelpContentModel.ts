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
  public mdContent: string
  public resourceLink: { Url: string, Description: string }
  public externalUrl: string

  constructor(spItem: TypedHash<any>, public web: Web) {
    this.title = spItem.Title
    this.iconName = spItem.IconName
    this.urlPattern = spItem.URL
    this.textContent = spItem.TextContent
    this.resourceLink = spItem.ResourceLink
    this.externalUrl = spItem.ExternalURL
  }

  /**
   * Checks if the help content matches the specified url
   * 
   * @param {string} url Url
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
      this.mdContent = md
    } catch (error) {

    }
  }
}
