/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFooterApplicationCustomizerProperties {}

export class InstallationEntry {
  // Install command
  public installCommand: string

  // Install start time
  public installStartTime: Date

  // Install end time
  public installEndTime: Date

  // Install duration in minutes
  public installDuration: number

  // Install version
  public installVersion: string

  // Install channel
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
    this.installVersion = entryItem.InstallVersion
    this.installChannel = entryItem.InstallChannel
  }
}
