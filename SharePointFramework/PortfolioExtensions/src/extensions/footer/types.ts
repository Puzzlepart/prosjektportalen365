import { Version } from '@microsoft/sp-core-library'

/** Public-media base path supplied to the footer custom action. */
export interface IFooterApplicationCustomizerProperties {
  publicMediaBasePath: string
}

/** Parses an installation log row's date, version and release channel. */
export class InstallationEntry {
  /**
   * Install date
   */
  public installedDate: Date

  /**
   * Stored installation version including the final dot-separated build/hash suffix.
   */
  public fullInstallVersion: string

  /**
   * Install version parsed as a `Version` object
   */
  public installVersion: Version

  /**
   * Install channel (e.g. `main` or `test`).
   */
  public installChannel: string

  constructor(entryItem: Record<string, any>) {
    this.installedDate = new Date(entryItem.InstallEndTime)
    this.fullInstallVersion = entryItem.InstallVersion
    this.installVersion = Version.tryParse(
      this.fullInstallVersion.substring(0, this.fullInstallVersion.lastIndexOf('.'))
    )
    this.installChannel = entryItem.InstallChannel
  }
}

/** GitHub release metadata used by the footer's version comparison and release links. */
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

/** Downloadable asset metadata returned by the GitHub releases API. */
export interface IGitHubReleaseAsset {
  url: string
  id: number
  node_id: string
  name: string
  // GitHub's API answers null for an asset without a label.
  // eslint-disable-next-line @rushstack/no-new-null
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

/** Maps a help-list row and optionally loads its external Markdown content. */
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

  constructor(
    spItem: Record<string, any>,
    public web: any
  ) {
    this.title = spItem.Title
    this.iconName = spItem.GtIconName
    this.urlPattern = spItem.GtURL
    this.textContent = spItem.GtTextContent
    this.resourceLink = spItem.GtResourceLink
    this.resourceLinkIcon = spItem.GtResourceLinkIcon ?? 'Page'
    this.externalUrl = spItem.GtExternalURL
  }

  /**
   * Checks whether the decoded URL contains this entry's configured URL fragment.
   */
  public matchPattern(url: string): boolean {
    return decodeURIComponent(url).indexOf(this.urlPattern) !== -1
  }

  /**
   * Loads external Markdown, removes front matter and resolves relative media links.
   * Keeps the entry's own help text if fetching or processing fails.
   */
  public async fetchExternalContent(publicMediaBasePath?: string) {
    this._publicMediaBasePath = publicMediaBasePath ?? this._getPublicMediaBasePath()
    try {
      let md = await (await fetch(this.externalUrl, { method: 'GET' })).text()
      md = this._removeJekyllHeader(md)
      md = this._fixImageLinks(md)
      this.markdownContent = md
    } catch {
      // Without the external page, the help shows its own text only.
    }
  }

  /**
   * Resolves the external page's sibling media directory.
   */
  private _getPublicMediaBasePath() {
    const externalUrlParts = this.externalUrl.split('/')
    return `${externalUrlParts.splice(0, externalUrlParts.length - 1).join('/')}/media`
  }

  /**
   * Points the relative media links (`./media/...`) at the public media base path. Each link ends
   * at its own closing parenthesis, so two images on one line stay two links.
   */
  private _fixImageLinks(markdownContent: string) {
    return markdownContent.replace(
      /\(\.\/media\/([^)]+)\)/g,
      (_, image: string) => `(${`${this._publicMediaBasePath}/${image}`.replace(/ /g, '%20')})`
    )
  }

  /**
   * Removes the Jekyll front matter, the block between the two `---` lines that opens the file.
   * A `---` further down is a horizontal rule and stays, with everything before it.
   */
  private _removeJekyllHeader(md: string) {
    return md.replace(/^\s*---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '')
  }
}
