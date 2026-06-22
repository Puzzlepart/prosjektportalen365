import { override } from '@microsoft/decorators'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters
} from '@microsoft/sp-listview-extensibility'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { PermissionKind } from '@pnp/sp/security'
import { getId } from '@fluentui/react/lib/Utilities'
import { themeColor } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import resource from 'SharedResources'
import { TemplatePackageCatalog } from 'components/TemplatePackageCatalog'
import SPDataAdapter from '../../data/SPDataAdapter'
import { ITemplatePackageCatalogCommandProperties } from './types'

declare const DEBUG: boolean

const OPEN_COMMAND = 'OPEN_TEMPLATE_PACKAGE_CATALOG'

/**
 * ListView Command Set on the Maloppsett list that opens the
 * {@link TemplatePackageCatalog} drawer ("Malpakkekatalog").
 *
 * Registered on every generic list via the CustomAction (RegistrationId 100),
 * so visibility is gated here to the Maloppsett list (locale-stable URL) and
 * to users with `ManageWeb` on the hub.
 */
export default class TemplatePackageCatalogCommandSet extends BaseListViewCommandSet<ITemplatePackageCatalogCommandProperties> {
  private _openCmd: Command
  private _placeholderId = getId('templatepackagecatalog')
  private _userAuthorized = false
  private _isConfigured = false

  @override
  public async onInit(): Promise<void> {
    Logger.subscribe(ConsoleListener())
    Logger.activeLogLevel =
      sessionStorage.getItem('DEBUG') === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning
    this._openCmd = this.tryGetCommand(OPEN_COMMAND)
    if (!this._openCmd) return
    this._openCmd.title = strings.TemplatePackageCatalogCommandTitle
    this._openCmd.iconImageUrl = this._getIcon()
    this._openCmd.visible = false

    try {
      await SPDataAdapter.configure(this.context, {
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl
      })
      this._userAuthorized = await SPDataAdapter.sp.web.currentUserHasPermissions(
        PermissionKind.ManageWeb
      )
      this._isConfigured = true
    } catch (error) {
      Logger.log({
        message: `(TemplatePackageCatalogCommandSet) onInit: failed to configure - ${error?.message}`,
        level: LogLevel.Warning
      })
    }

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged)

    // Compute the initial visibility now. `listViewStateChangedEvent` only fires
    // on later state changes (e.g. selecting a row), not on first load, so
    // without this the command would stay hidden until the user selects an item.
    // onInit is awaited by the framework before commands render, so setting it
    // here makes the command show on its own initially.
    this._updateVisibility()
  }

  /**
   * Only show the command on the Maloppsett list for authorized admins. The
   * list URL (`Lists/TemplateOptions` / `Lists/Maloppsett`) is locale-stable,
   * unlike the display title.
   */
  private _updateVisibility(): void {
    this._openCmd = this.tryGetCommand(OPEN_COMMAND)
    if (!this._openCmd) return
    const listUrl = (this.context.pageContext.list?.serverRelativeUrl ?? '').toLowerCase()
    const templateOptionsUrl = (resource.Lists_TemplateOptions_Url ?? '').toLowerCase()
    const isTemplateOptionsList =
      templateOptionsUrl.length > 0 && listUrl.endsWith(templateOptionsUrl)
    const visible = this._isConfigured && this._userAuthorized && isTemplateOptionsList
    if (this._openCmd.visible !== visible) {
      this._openCmd.visible = visible
      this.raiseOnChange()
    }
  }

  private _onListViewStateChanged = (): void => {
    this._updateVisibility()
  }

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    if (event.itemId !== OPEN_COMMAND) return
    const placeholder = this._getPlaceholder()
    render(
      React.createElement(TemplatePackageCatalog, {
        context: this.context,
        catalogUrl: this.properties.catalogUrl,
        userGuideUrl: this.properties.userGuideUrl,
        featureFlagProvisioning: this.properties.featureFlagProvisioning,
        onDismiss: () => this._unmount(placeholder)
      }),
      placeholder
    )
  }

  private _getPlaceholder(): HTMLElement {
    let placeholder = document.getElementById(this._placeholderId)
    if (placeholder === null) {
      placeholder = document.createElement('div')
      placeholder.id = this._placeholderId
      document.body.appendChild(placeholder)
    }
    return placeholder
  }

  private _unmount(placeholder: HTMLElement): void {
    unmountComponentAtNode(placeholder)
  }

  private _getIcon(): string {
    const fill = (themeColor ?? '#0078d4').replace('#', '%23')
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z' fill='${fill}'/%3E%3C/svg%3E`
  }
}
