import {
  BaseApplicationCustomizer, PlaceholderContent, PlaceholderName
} from '@microsoft/sp-application-base'
import { Footer, IFooterProps } from 'components/Footer'
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
    this._installEntries = await this._fetchInstallationLogs()
    this._renderFooter(PlaceholderName.Bottom, { installEntries: this._installEntries })
  }

  /**
   * Fetch the installation logs from the `strings.InstallationLogListName` list. Converts
   * the item properties to match the `IInstallationEntry` interface.
   * 
   * @param orderBy Property to order by
   * @param orderAscending Order ascending or descending
   */
  private async _fetchInstallationLogs(orderBy = 'InstallStartTime', orderAscending = false) {
    const installationLogList = this._sp.web.lists.getByTitle(strings.InstallationLogListName)
    const installationLogItems = await installationLogList.items.orderBy(orderBy, orderAscending)()
    return installationLogItems.map(item => ({
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
   * @param footerProps Props for the `Footer` component
   */
  private _renderFooter(name: PlaceholderName, footerProps: IFooterProps): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder =
        this.context.placeholderProvider.tryCreateContent(
          name,
          { onDispose: this._onDispose })
    }
    const footerElement: HTMLDivElement = document.createElement('div')
    ReactDOM.render(React.createElement(Footer, footerProps), footerElement)
    this._bottomPlaceholder.domElement.append(footerElement)
  }
  /**
   * Dispose the bottom placeholder when the footer is disposed.
   */
  protected _onDispose(): void {
    this._bottomPlaceholder.dispose()
  }
}
