import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { getId } from '@uifabric/utilities';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApplicationInsightsLogListener } from 'shared/lib/logging';
import { default as HubSiteService, IHubSite } from 'sp-hubsite-service';
import { DocumentTemplateDialog, IDocumentTemplateDialogProps } from '../../components';
import { SPDataAdapter } from '../../data';
import { IDocumentLibrary, TemplateFile } from '../../models';
import { ITemplateSelectorCommandProperties } from './ITemplateSelectorCommandProperties';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;


export default class TemplateSelectorCommand extends BaseListViewCommandSet<ITemplateSelectorCommandProperties> {
  private _hub: IHubSite;
  private _templates: TemplateFile[] = [];
  private _libraries: IDocumentLibrary[];
  private _templateLibrary: string;
  private _placeholderIds = { DocumentTemplateDialog: getId('documenttemplatedialog') };

  @override
  public async onInit() {
    Logger.log({ message: '(TemplateSelectorCommand) onInit: Initializing', data: { version: this.context.manifest.version, placeholderIds: this._placeholderIds }, level: LogLevel.Info });
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = DEBUG ? LogLevel.Info : LogLevel.Error;
    this._hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: this._hub.url,
    });
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (!openTemplateSelectorCommand) return;
    try {
      this._templateLibrary = this.properties.templateLibrary || 'Malbibliotek';
      this._templates = await SPDataAdapter.getDocumentTemplates(this._templateLibrary, this.properties.viewXml);
      Logger.log({ message: `(TemplateSelectorCommand) onInit: Retrieved ${this._templates.length} templates from the specified template library`, level: LogLevel.Info });
    } catch (error) {
      Logger.log({ message: '(TemplateSelectorCommand) onInit: Failed to initialize', level: LogLevel.Warning });
    }
  }

  @override
  public onListViewUpdated(_event: IListViewCommandSetListViewUpdatedParameters): void {
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (openTemplateSelectorCommand) {
      openTemplateSelectorCommand.visible = true;
    }
  }

  @override
  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> {
    switch (event.itemId) {
      case 'OPEN_TEMPLATE_SELECTOR':
        this._libraries = await SPDataAdapter.getLibraries();
        this._onOpenTemplateSelector();
        break;
    }
  }

  /**
   * On open <DocumentTemplateDialog />
   */
  private _onOpenTemplateSelector() {
    let placeholder = this._getPlaceholder('DocumentTemplateDialog');
    const element = React.createElement<IDocumentTemplateDialogProps>(DocumentTemplateDialog, {
      title: strings.TemplateLibrarySelectModalTitle,
      onDismiss: () => {
        this._unmount(placeholder);
        document.location.href = document.location.href;
      },
      libraries: this._libraries,
      templates: this._templates,
      templateLibrary: { title: this._templateLibrary, url: `${this._hub.url}/${this._templateLibrary}` },
    });
    ReactDOM.render(element, placeholder);
  }

  private _unmount(container: HTMLElement) {
    ReactDOM.unmountComponentAtNode(container);
  }

  private _getPlaceholder(key: 'DocumentTemplateDialog') {
    const id = this._placeholderIds[key];
    let placeholder = document.getElementById(id);
    if (placeholder === null) {
      placeholder = document.createElement('DIV');
      placeholder.id = this._placeholderIds[key];
      placeholder.setAttribute('name', key);
      return document.body.appendChild(placeholder);
    }
    return placeholder;
  }
}
