import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { default as HubSiteService, IHubSite } from 'sp-hubsite-service';
import { DocumentTemplateDialog, IDocumentTemplateDialogProps, IDocumentTemplateDialogDismissProps } from '../../components';
import { SPDataAdapter } from '../../data';
import { IDocumentLibrary, TemplateFile } from '../../models';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;


export default class TemplateSelectorCommandSet extends BaseListViewCommandSet<ITemplateSelectorCommandSetProperties> {
  private _hub: IHubSite;
  private _templates: TemplateFile[] = [];
  private _libraries: IDocumentLibrary[];
  private _container: Element;
  private _templateLibrary: string;

  @override
  public async onInit() {
    this._hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: this._hub.url,
    });
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (!openTemplateSelectorCommand) return;
    Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Initializing', data: { version: this.context.manifest.version }, level: LogLevel.Info });
    try {
      this._templateLibrary = this.properties.templateLibrary || 'Malbibliotek';
      this._templates = await SPDataAdapter.getDocumentTemplates(this._templateLibrary, this.properties.viewXml);
      Logger.log({ message: `(TemplateSelectorCommandSet) onInit: Retrieved ${this._templates.length} templates from the specified template library`, level: LogLevel.Info });
    } catch (error) {
      Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Failed to initialize', level: LogLevel.Warning });
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
    const element = React.createElement<IDocumentTemplateDialogProps>(DocumentTemplateDialog, {
      title: strings.TemplateLibrarySelectModalTitle,
      onDismiss: this._onDismissDocumentTemplateDialog.bind(this),
      libraries: this._libraries,
      templates: this._templates,
      templateLibrary: { title: this._templateLibrary, url: `${this._hub.url}/${this._templateLibrary}` },
    });
    this._container = document.createElement('DIV');
    document.body.appendChild(this._container);
    ReactDOM.render(element, this._container);
  }

  /**
   * On dismiss <DocumentTemplateDialog />
   * 
   * @param {IDocumentTemplateDialogDismissProps} props Dismiss props
   */
  private _onDismissDocumentTemplateDialog(props: IDocumentTemplateDialogDismissProps) {
    ReactDOM.unmountComponentAtNode(this._container);
    if (props.reload) document.location.href = document.location.href;
  }
}
