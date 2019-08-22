import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp, Web } from '@pnp/sp';
import { ListLogger } from 'shared/lib/logging';
import MSGraphHelper from 'msgraph-helper';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HubSiteService from 'sp-hubsite-service';
import { ErrorModal, IErrorModalProps, IProgressModalProps, ITemplateSelectModalState, ProgressModal, TemplateSelectModal } from '../../components';
import { getHubFiles, getHubItems } from '../../data';
import { ListContentConfig, ProjectTemplate } from './../../models';
import { IBaseTaskParams, Tasks } from './../../tasks';
import IProjectSetupApplicationCustomizerData from './IProjectSetupApplicationCustomizerData';
import { IProjectSetupApplicationCustomizerProperties } from './IProjectSetupApplicationCustomizerProperties';
import { ProjectSetupError } from './ProjectSetupError';

export default class ProjectSetupApplicationCustomizer extends BaseApplicationCustomizer<IProjectSetupApplicationCustomizerProperties> {
  private _domElement: HTMLDivElement;
  private _templateSelectModalContainer: HTMLElement;
  private _progressModalContainer: HTMLElement;
  private _data: IProjectSetupApplicationCustomizerData;
  private _taskParams: IBaseTaskParams;

  public constructor() {
    super();
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
  }

  @override
  public async onInit(): Promise<void> {
    sp.setup({ spfxContext: this.context });
    const { isSiteAdmin, groupId, hubSiteId } = this.context.pageContext.legacyPageContext;
    if (isSiteAdmin && groupId) {
      try {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) onInit: Initializing pre-conditionals before initializing setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
        const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top);
        this._domElement = topPlaceholder.domElement;
        if (this.context.pageContext.web.language !== 1044) {
          await this.removeCustomizer(this.componentId, false);
          throw new ProjectSetupError(strings.InvalidLanguageErrorMessage, strings.InvalidLanguageErrorStack);
        } else if (!hubSiteId) {
          throw new ProjectSetupError(strings.NoHubSiteErrorMessage, strings.NoHubSiteErrorStack, MessageBarType.severeWarning);
        } else {
          this.initializeSetup();
        }
      } catch (error) {
        this.renderErrorModal({ error });
      }
    }
  }

  /**
   * Intiialize setup
   */
  protected async initializeSetup() {
    try {
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) initializeSetup: Initializing setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      this._data = await this.getData();
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) initializeSetup: Data retrieved, initializing list logger', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      this.initLogging(this._data.hub.web);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) initializeSetup: Awaiting template selection from user', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      const templateInfo = await this.getTemplateInfo();
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) initializeSetup: Template selected by user', data: { selectedTemplate: templateInfo.selectedTemplate.title }, level: LogLevel.Info });
      ReactDOM.unmountComponentAtNode(this._templateSelectModalContainer);
      this._data = { ...this._data, ...templateInfo };
      this._taskParams = {
        context: this.context,
        properties: this.properties,
        data: this._data,
        templateParameters: { fieldsgroup: strings.SiteFieldsGroupName },
      };
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) initializeSetup: Rendering progrss modal', data: { selectedTemplate: templateInfo.selectedTemplate.title }, level: LogLevel.Info });
      this.renderProgressModal({ text: strings.ProgressModalLabel, subText: strings.ProgressModalDescription, iconName: 'Page' });
      await this.startProvision();
      await this.removeCustomizer(this.componentId, !this.isDebug());
    } catch (error) {
      this.renderErrorModal({ error });
    }
  }

  /**
   * Init logging
   * 
   * @param {Web} hubWeb Hub web
   * @param {string} listName List name
   */
  protected initLogging(hubWeb: Web, listName: string = 'Logg') {
    ListLogger.init(
      hubWeb.lists.getByTitle(listName),
      {
        webUrl: 'GtLogWebUrl',
        scope: 'GtLogScope',
        functionName: 'GtLogFunctionName',
        message: 'GtLogMessage',
        level: 'GtLogLevel',
      },
      this.context.pageContext.web.absoluteUrl,
      'ProjectSetupApplicationCustomizer',
    );
  }

  /**
   * Render TemplateSelectModal
   */
  private getTemplateInfo(): Promise<ITemplateSelectModalState> {
    return new Promise(resolve => {
      const templateSelectModal = React.createElement(TemplateSelectModal, {
        key: 'ProjectSetupApplicationCustomizer_TemplateSelectModal',
        data: this._data,
        onSubmit: (state: ITemplateSelectModalState) => resolve(state),
        versionString: `v${this.manifest.version}`,
      });
      this._templateSelectModalContainer = document.createElement('DIV');
      this._domElement.appendChild(this._templateSelectModalContainer);
      ReactDOM.render(templateSelectModal, this._templateSelectModalContainer);
    });
  }

  /**
   * Render ProgressModal
   * 
   * @param {IProgressModalProps} props Props
   */
  private renderProgressModal(props: IProgressModalProps) {
    const progressModal = React.createElement(ProgressModal, {
      key: 'ProjectSetupApplicationCustomizer_ProgressModal',
      ...props,
      taskParams: this._taskParams,
      versionString: `v${this.manifest.version}`,
    });
    if (!this._progressModalContainer) {
      this._progressModalContainer = document.createElement('DIV');
      this._domElement.appendChild(this._progressModalContainer);
    }
    ReactDOM.render(progressModal, this._progressModalContainer);
  }

  /**
   * Render ErrorModal
   * 
   * @param {IProgressModalProps} props Props
   */
  private renderErrorModal(props: IErrorModalProps) {
    const errorModal = React.createElement(ErrorModal, {
      key: 'ProjectSetupApplicationCustomizer_ProgressModal',
      versionString: `v${this.manifest.version}`,
      ...props,
    });
    if (!this._progressModalContainer) {
      this._progressModalContainer = document.createElement('DIV');
      this._domElement.appendChild(this._progressModalContainer);
    }
    ReactDOM.render(errorModal, this._progressModalContainer);
  }

  /**
  * Start provision
  */
  private async startProvision(): Promise<void> {
    Logger.log({ message: '(ProjectSetupApplicationCustomizer) startProvision', data: { properties: this.properties, tasks: Tasks.map(t => t.name) }, level: LogLevel.Info });
    try {
      await ListLogger.write('Starting provisioning of project.', 'Info');
      this._taskParams.templateSchema = await this._taskParams.data.selectedTemplate.getSchema();
      for (let i = 0; i < Tasks.length; i++) {
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) startProvision: Executing task ${Tasks[i].name}`, level: LogLevel.Info });
        this._taskParams = await Tasks[i].execute(this._taskParams, this.onTaskStatusUpdated.bind(this));
      }
      await ListLogger.write('Project successfully provisioned.', 'Info');
    } catch (error) {
      throw error;
    }
  }

  /**
   * On task status updated
   * 
   * @param {string} status Status
   * @param {string} iconName Icon name
   */
  private onTaskStatusUpdated(status: string, iconName: string) {
    this.renderProgressModal({ text: strings.ProgressModalLabel, subText: status, iconName });
  }

  /**
   * Remove customizer
   * 
   * @param {string} componentId Component ID
   * @param {boolean} reload Reload page after customizer removal
   */
  private async removeCustomizer(componentId: string, reload: boolean): Promise<void> {
    let customActions = await sp.web.userCustomActions.get();
    for (let i = 0; i < customActions.length; i++) {
      var { ClientSideComponentId, Id } = customActions[i];
      if (ClientSideComponentId === componentId) {
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) removeCustomizer: Removing custom action ${Id}`, level: LogLevel.Info });
        await sp.web.userCustomActions.getById(Id).delete();
        break;
      }
    }
    if (reload) {
      window.location.href = this.context.pageContext.web.absoluteUrl;
    }
  }

  /**
   * Get data
   */
  private async getData(): Promise<IProjectSetupApplicationCustomizerData> {
    try {
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) getData: Retrieving required data for setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      await MSGraphHelper.Init(this.context.msGraphClientFactory);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) getData: Retrieving hub site url', data: {}, level: LogLevel.Info });
      let _data: IProjectSetupApplicationCustomizerData = {};
      _data.hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) getData: Retrieved hub site url', data: { hubUrl: _data.hub.url }, level: LogLevel.Info });
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) getData: Retrieving templates, extensions and content config', data: {}, level: LogLevel.Info });
      const [templates, extensions, listContentConfig] = await Promise.all([
        getHubFiles(_data.hub, this.properties.templatesLibrary, ProjectTemplate),
        getHubFiles(_data.hub, this.properties.extensionsLibrary, ProjectTemplate),
        getHubItems(_data.hub, this.properties.contentConfigList, ListContentConfig),
      ]);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) getData: Retrieved templates, extensions and content config', data: { templates: templates.length, extensions: extensions.length, listContentConfig: listContentConfig.length }, level: LogLevel.Info });
      return {
        ..._data,
        templates,
        extensions,
        listContentConfig,
      };
    } catch (e) {
      throw new ProjectSetupError(strings.GetSetupDataErrorMessage, strings.GetSetupDataErrorStack);
    }
  }

  /**
   * Is debug
   * 
   * Typically true when running 'gulp serve'
   */
  private isDebug(): boolean {
    return document.location.search.toLowerCase().indexOf('debugmanifestsfile') !== -1;
  }
}
