/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */

import { Version } from '@microsoft/sp-core-library'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFooterApplicationCustomizerProperties {}

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
