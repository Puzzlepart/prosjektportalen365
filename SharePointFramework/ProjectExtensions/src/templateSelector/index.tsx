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

Logger.subscribe(new ConsoleListener())
Logger.activeLogLevel = LogLevel.Info

export default class TemplateSelectorCommand extends BaseListViewCommandSet<ITemplateSelectorCommandProperties> {
  private _openCmd: Command
  private _ctxValue: ITemplateSelectorContext = { templates: [] }
  private _placeholderIds = {
    DocumentTemplateDialog: getId('documenttemplatedialog')
  }

  @override
  public async onInit() {
    Logger.log({
      message: '(TemplateSelectorCommand) onInit: Initializing',
      data: {
        version: this.context.manifest.version,
        placeholderIds: this._placeholderIds
      },
      level: LogLevel.Info
    })
    Logger.subscribe(new ConsoleListener())
    Logger.activeLogLevel =
      sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    await SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl
    })
    this._openCmd = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR')
    if (!this._openCmd) return
    try {
      const propertiesData = await SPDataAdapter.project.getPropertiesData()
      const templateLib: string =
        propertiesData.templateParameters.TemplateDocumentLibrary ??
        this.properties.templateLibrary ??
        'Malbibliotek'
      this._ctxValue.templateLibrary = {
        title: templateLib,
        url: `${SPDataAdapter.portal.url}/${templateLib}`
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
      this._ctxValue.error = error
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
  public async onExecute(
    event: IListViewCommandSetExecuteEventParameters
  ): Promise<void> {
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
