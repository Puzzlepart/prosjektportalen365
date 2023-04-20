/* eslint-disable max-classes-per-file */
import { Version } from '@microsoft/sp-core-library'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFooterApplicationCustomizerProperties {
  publicMediaBasePath: string
}

export class InstallationEntry {
  /**
   * Install command
   */
  public installCommand: string

  /**
   * Install start time
   */
  public installStartTime: Date

  /**
   * Install end time
   */
  public installEndTime: Date

  /**
   * Install duration in minutes
   */
  public installDuration: number

  /**
   * Full install version including git hash (format: `v1.2.3-abcdef`)
   */
  public fullInstallVersion: string

  /**
   * Install version parsed as a `Version` object
   */
  public installVersion: Version

  /**
   * Install channel (e.g. `dev` or `beta`)
   */
  public installChannel: string

  /**
   * Creates a new InstallationEntry object from the given entry item
   *
   * @param entryItem Item from the installation entry
   */
  constructor(entryItem: Record<string, any>) {
    this.installCommand = entryItem.InstallCommand
    this.installStartTime = new Date(entryItem.InstallStartTime)
    this.installEndTime = new Date(entryItem.InstallEndTime)
    const installDurationMs = this.installEndTime.getTime() - this.installStartTime.getTime()
    this.installDuration = Math.round(((installDurationMs % 86400000) % 3600000) / 60000)
    this.fullInstallVersion = entryItem.InstallVersion
    this.installVersion = Version.tryParse(
      this.fullInstallVersion.substring(0, this.fullInstallVersion.lastIndexOf('.'))
    )
  }
}

export interface IGitHubRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  author: any
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
  assets: IGitHubReleaseAsset[]
  tarball_url: string
  zipball_url: string
  body: string
  discussion_url?: string
}

export interface IGitHubReleaseAsset {
  url: string
  id: number
  node_id: string
  name: string
  label: null | string
  uploader: any
  content_type: any
  state: any
  size: number
  download_count: number
  created_at: string
  updated_at: string
  browser_download_url: string
}

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

  constructor(spItem: Record<string, any>, public web: any) {
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
