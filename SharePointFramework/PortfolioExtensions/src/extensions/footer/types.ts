/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFooterApplicationCustomizerProperties {
}

export interface IInstallationEntry {
  installCommand: string
  installEndTime: Date
  installStartTime: Date
  installVersion: string
  installChannel: string
}