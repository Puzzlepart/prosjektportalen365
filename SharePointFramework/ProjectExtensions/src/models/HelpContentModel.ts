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
   *
   * @param imagesBasePath Images base path
   */
  public async fetchExternalContent(imagesBasePath?: string) {
    try {
      let md = await (await fetch(this.externalUrl, { method: 'GET' })).text()
      md = this._removeJekyllHeader(md)
      if (imagesBasePath) md = this._fixImageLinks(md, imagesBasePath)
      this.markdownContent = md
    } catch (error) {}
  }

  /**
   * Fix image links
   *
   * @param markdownContent Markdown content
   * @param imagesBasePath Images base path
   */
  private _fixImageLinks(markdownContent: string, imagesBasePath: string) {
    let md = markdownContent
    const regex = /\((\.\/media\/(.+))\)/gm
    let m: RegExpExecArray
    while ((m = regex.exec(md)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }
      const [, imageLink, image] = m
      const newImageLink = `${imagesBasePath}/${image}`
      md = md.replace(imageLink, newImageLink)
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
    // ./media/image19.png
    // https://puzzlepart.github.io/prosjektportalen-manual/Brukermanual/3%20Portefolje/media/image19.png
    return md.replace(/^\-\-\-([\n\w\W\s]+)\-\-\-$/gm, '')
  }
}
