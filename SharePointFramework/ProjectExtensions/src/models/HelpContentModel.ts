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
  private _publicMediaBasePath: string

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
   *
   * @param publicMediaBasePath Public media base path
   */
  public async fetchExternalContent(publicMediaBasePath?: string) {
    this._publicMediaBasePath = publicMediaBasePath ?? this._getPublicMediaBasePath()
    try {
      let md = await (await fetch(this.externalUrl, { method: 'GET' })).text()
      md = this._removeJekyllHeader(md)
      md = this._fixImageLinks(md)
      this.markdownContent = md
    } catch (error) {}
  }

  /**
   * Get media base path based on `externalUrl
   */
  private _getPublicMediaBasePath() {
    const externalUrlParts = this.externalUrl.split('/')
    return `${externalUrlParts.splice(0, externalUrlParts.length - 1).join('/')}/media`
  }

  /**
   * Fix media links
   *
   * @param markdownContent Markdown content
   */
  private _fixImageLinks(markdownContent: string) {
    let md = markdownContent
    const regex = /\((\.\/media\/(.+))\)/gm
    let m: RegExpExecArray
    while ((m = regex.exec(md)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }
      const [, oldImageLink, image] = m
      const newImageLink = `${this._publicMediaBasePath}/${image}`.replace(/ /g, '%20')
      md = md.replace(oldImageLink, newImageLink)
    }
    return md
  }

  /**
   * Removed Jekyll header data using regex
   *
   * @see https://regex101.com/r/dvc3qc/1
   *
   * @param md Markdown content
   */
  private _removeJekyllHeader(md: string) {
    return md.replace(/^\-\-\-([\n\w\W\s]+)\-\-\-$/gm, '')
  }
}
