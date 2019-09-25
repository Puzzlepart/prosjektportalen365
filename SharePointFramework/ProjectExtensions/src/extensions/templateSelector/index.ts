import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { default as HubSiteService } from 'sp-hubsite-service';
import { DocumentTemplateModal } from '../../components/index';
import { default as SPDataAdapter } from '../../data';
import { IDocumentLibrary, TemplateFile } from '../../models/index';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Warning;


export default class TemplateSelectorCommandSet extends BaseListViewCommandSet<ITemplateSelectorCommandSetProperties> {
  private _templates: TemplateFile[] = [];
  private _libraries: IDocumentLibrary[];
  private _container: Element;

  @override
  public async onInit() {
    const hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    SPDataAdapter.configure({
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: hub.url,
    });
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (!openTemplateSelectorCommand) return;
    Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Initializing', data: { version: this.context.manifest.version }, level: LogLevel.Info });
    try {
      this._templates = await SPDataAdapter.getDocumentTemplates(this.properties.templateLibrary);
      Logger.log({ message: `(TemplateSelectorCommandSet) onInit: Retrieved ${this._templates.length} templates from the specified template library`, level: LogLevel.Info });
    } catch (error) {
      Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Failed to initialize', level: LogLevel.Warning });
    }
  }

  @override
  public onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): void {
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (openTemplateSelectorCommand) {
      openTemplateSelectorCommand.visible = event.selectedRows.length === 0 && this._templates.length > 0;
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
   * On open <DocumentTemplateModal />
   */
  private _onOpenTemplateSelector() {
    const templateLibrarySelectModal = React.createElement(DocumentTemplateModal, {
      title: strings.TemplateLibrarySelectModalTitle,
      onDismiss: this._onDismissTemplateLibrarySelectModal.bind(this),
      libraries: this._libraries,
      templates: this._templates,
    });
    this._container = document.createElement('DIV');
    document.body.appendChild(this._container);
    ReactDOM.render(templateLibrarySelectModal, this._container);
  }

  /**
   * On dismiss <DocumentTemplateModal />
   */
  private _onDismissTemplateLibrarySelectModal() {
    ReactDOM.unmountComponentAtNode(this._container);
    document.location.href = document.location.href;
  }
}
