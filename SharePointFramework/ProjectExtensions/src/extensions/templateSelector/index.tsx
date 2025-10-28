import { override } from '@microsoft/decorators'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters
} from '@microsoft/sp-listview-extensibility'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { getId } from '@uifabric/utilities'
import { DocumentTemplateDialog } from 'components'
import { SPDataAdapter } from 'data'
import * as strings from 'ProjectExtensionsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { find, first } from 'underscore'
import { ITemplateSelectorContext, TemplateSelectorContext } from './context'
import { ITemplateSelectorCommandProperties } from './types'
import { themeColor } from 'pp365-shared-library'
import resource from 'SharedResources'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = LogLevel.Info

export default class TemplateSelectorCommand extends BaseListViewCommandSet<ITemplateSelectorCommandProperties> {
  private _openCmd: Command
  private _ctxValue: ITemplateSelectorContext = {}
  private _placeholderIds = { DocumentTemplateDialog: getId('documenttemplatedialog') }

  @override
  public async onInit() {
    Logger.log({
      message: '(TemplateSelectorCommand) onInit: Initializing',
      data: { version: this.context.manifest.version, placeholderIds: this._placeholderIds },
      level: LogLevel.Info
    })
    Logger.subscribe(ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    await SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl
    })
    this._openCmd = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR')
    if (!this._openCmd) return

    this._openCmd.title = strings.TemplateSelectorCommandTitle

    const fillColor = themeColor
    const exportSvg = `data:image/svg+xml,%3Csvg width='24' height='24' fill='none' viewBox='0 0 100% 100%' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7.25 2A2.25 2.25 0 0 0 5 4.25v7.136a2.5 2.5 0 0 1 1.5-.159V4.25a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 .75.75V17H12v1.5h6.25a3.25 3.25 0 0 0 3.25-3.25V12H18V4.25A2.25 2.25 0 0 0 15.75 2h-8.5Zm11 15H18v-3.5h2v1.75A1.75 1.75 0 0 1 18.25 17Zm-7.632-3.809c.172.086.33.19.475.309h3.157a.75.75 0 0 0 0-1.5h-5.5a.747.747 0 0 0-.346.084l2.214 1.107ZM8.75 5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 3.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5ZM1 19.573v-4.146a1.5 1.5 0 0 1 .83-1.342l3.5-1.75a1.5 1.5 0 0 1 1.34 0l3.5 1.75a1.5 1.5 0 0 1 .83 1.342v4.146a1.5 1.5 0 0 1-.83 1.342l-3.5 1.75a1.5 1.5 0 0 1-1.34 0l-3.5-1.75A1.5 1.5 0 0 1 1 19.573Zm1.553-4.047a.5.5 0 0 0 .223.671L5.5 17.56V20.5a.5.5 0 1 0 1 0v-2.941l2.724-1.362a.5.5 0 1 0-.448-.894L6 16.69l-2.776-1.388a.5.5 0 0 0-.671.223Z' fill='${fillColor.replace(
      '#',
      '%23'
    )}'/%3E%3C/svg%3E`
    this._openCmd.iconImageUrl = exportSvg

    try {
      const templateLib = this.properties.templateLibrary || resource.Lists_TemplateLibrary_Title
      this._ctxValue.templateLibrary = {
        title: templateLib,
        url: `${SPDataAdapter.portalDataService.url}/${templateLib}`
      }
      this._ctxValue.templates = await SPDataAdapter.getDocumentTemplates(
        templateLib,
        '<View Scope="RecursiveAll"></View>'
      )
      Logger.log({
        message: `(TemplateSelectorCommand) onInit: Retrieved ${this._ctxValue.templates.length} templates from the specified template library`,
        level: LogLevel.Info
      })
    } catch (error) {
      Logger.log({
        message: '(TemplateSelectorCommand) onInit: Failed to initialize',
        level: LogLevel.Warning
      })
    }
  }

  @override
  public onListViewUpdated(): void {
    this._openCmd = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR')
    if (this._openCmd) this._openCmd.visible = true
  }

  @override
  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> {
    // eslint-disable-next-line default-case
    switch (event.itemId) {
      case this._openCmd.id:
        this._ctxValue.libraries = await SPDataAdapter.getLibraries()
        this._ctxValue.currentLibrary = find(
          this._ctxValue.libraries,
          (lib) => lib.id === this.context.pageContext.list.id.toString()
        )
        if (!this._ctxValue.currentLibrary)
          this._ctxValue.currentLibrary = first(this._ctxValue.libraries)
        this._onOpenTemplateSelector()
        break
    }
  }

  /**
   * On open <DocumentTemplateDialog />
   */
  private _onOpenTemplateSelector() {
    const placeholder = this._getPlaceholder()
    const element = (
      <TemplateSelectorContext.Provider value={this._ctxValue}>
        <DocumentTemplateDialog
          title={strings.TemplateLibrarySelectModalTitle}
          onDismiss={(props) => {
            this._unmount(placeholder)
            if (props.reload) document.location.href = document.location.href
          }}
        />
      </TemplateSelectorContext.Provider>
    )
    render(element, placeholder)
  }

  private _unmount(container: HTMLElement) {
    unmountComponentAtNode(container)
  }

  private _getPlaceholder(key = 'DocumentTemplateDialog') {
    const id = this._placeholderIds[key]
    let placeholder = document.getElementById(id)
    if (placeholder === null) {
      placeholder = document.createElement('DIV')
      placeholder.id = this._placeholderIds[key]
      placeholder.setAttribute('name', key)
      return document.body.appendChild(placeholder)
    }
    return placeholder
  }
}
