import {
  BaseApplicationCustomizer, PlaceholderContent, PlaceholderName
} from '@microsoft/sp-application-base'
import { Footer } from 'components/Footer'
import React from 'react'
import ReactDOM from 'react-dom'
import { IFooterApplicationCustomizerProperties, IInstallationEntry } from './types'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import strings from 'PortfolioExtensionsStrings'

export default class FooterApplicationCustomizer
  extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {
  private _bottomPlaceholder: PlaceholderContent
  private _sp: SPFI
  private _installEntries: IInstallationEntry[]

  public async onInit(): Promise<void> {
    await super.onInit()
    this._sp = spfi().using(SPFx(this.context))
    await this._fetchInstallationLogs()
    this._renderFooter(PlaceholderName.Bottom)
  }

  private async _fetchInstallationLogs() {
    const installationLogList =  this._sp.web.lists.getByTitle(strings.InstallationLogListName)
    const installationLogItems = await installationLogList.items.orderBy('InstallStartTime', false)()
    this._installEntries = installationLogItems.map(item => ({
      installCommand: item.InstallCommand,
      installStartTime: new Date(item.InstallStartTime),
      installEndTime: new Date(item.InstallEndTime),
      installVersion: item.InstallVersion,
      installChannel: item.InstallChannel
    } as IInstallationEntry))
  }
 
  /**
   * Render the footer in the specified placeholder. Creates a
   * placeholder if it doesn't exist and adds a new div element
   * to the placeholder where the footer will be rendered.
   * 
   * @param name Placeholder name
   */
  private _renderFooter(name: PlaceholderName): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder =
        this.context.placeholderProvider.tryCreateContent(
          name,
          { onDispose: this._onDispose })
    }
    const footerElement: HTMLDivElement = document.createElement('div')
    ReactDOM.render(React.createElement(Footer, { installEntries: this._installEntries }), footerElement)
    this._bottomPlaceholder.domElement.append(footerElement)
  }
  /**
   * Dispose the bottom placeholder when the footer is disposed.
   */
  protected _onDispose(): void {
    this._bottomPlaceholder.dispose()
  }
}
