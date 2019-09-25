import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base';
import { isArray } from '@pnp/common';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp, Web } from '@pnp/sp';
import MSGraphHelper from 'msgraph-helper';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApplicationInsightsLogListener, ListLogger } from 'shared/lib/logging';
import { HubConfigurationService } from 'shared/lib/services';
import HubSiteService from 'sp-hubsite-service';
import { ErrorModal, IErrorModalProps, IProgressModalProps, ITemplateSelectModalProps, ITemplateSelectModalState, ProgressModal, TemplateSelectModal } from '../../components';
import { ListContentConfig, ProjectTemplate } from '../../models';
import { default as Tasks, IBaseTaskParams } from '../../tasks';
import IProjectSetupApplicationCustomizerData from './IProjectSetupApplicationCustomizerData';
import { IProjectSetupApplicationCustomizerProperties } from './IProjectSetupApplicationCustomizerProperties';
import { ProjectSetupError } from './ProjectSetupError';

export default class ProjectSetupApplicationCustomizer extends BaseApplicationCustomizer<IProjectSetupApplicationCustomizerProperties> {
  private _domElement: HTMLDivElement;
  private _templateSelectModalContainer: HTMLElement;
  private _progressModalContainer: HTMLElement;
  private _data: IProjectSetupApplicationCustomizerData;
  private _taskParams: IBaseTaskParams;
  private _hubConfigurationService: HubConfigurationService;

  public constructor() {
    super();
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = this._isDebug ? LogLevel.Info : LogLevel.Warning;
  }

  @override
  public async onInit(): Promise<void> {
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    sp.setup({
      spfxContext: this.context,
      defaultCachingStore: 'session',
      defaultCachingTimeoutSeconds: 15,
      enableCacheExpiration: true,
      cacheExpirationIntervalMilliseconds: 2500,
      globalCacheDisable: false,
    });
    if (!this.context.pageContext.legacyPageContext.isSiteAdmin || !this.context.pageContext.legacyPageContext.groupId) return;
    try {
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) onInit: Initializing pre-conditionals before initializing setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top);
      this._domElement = topPlaceholder.domElement;
      if (this.context.pageContext.web.language !== 1044) {
        await this._deleteCustomizer(this.componentId, false);
        throw new ProjectSetupError(strings.InvalidLanguageErrorMessage, strings.InvalidLanguageErrorStack);
      } else if (!this.context.pageContext.legacyPageContext.hubSiteId) {
        throw new ProjectSetupError(strings.NoHubSiteErrorMessage, strings.NoHubSiteErrorStack, MessageBarType.severeWarning);
      } else if (this.context.pageContext.legacyPageContext.currentCultureLCID !== 1044 || this.context.pageContext.legacyPageContext.currentLanguage !== 1044) {
        throw new ProjectSetupError(strings.SiteNotReadyErrorMessage, strings.SiteNotReadyErrorStack);
      } else {
        this._taskParams = {
          web: new Web(this.context.pageContext.web.absoluteUrl),
          webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
          templateExcludeHandlers: [],
          context: this.context,
          properties: this.properties,
        };
        this._initializeSetup();
      }
    } catch (error) {
      this._renderErrorModal({ error });
    }
  }

  /**
   * Intiialize setup
   */
  protected async _initializeSetup() {
    try {
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _initializeSetup: Initializing setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      this._data = await this._fetchData();
      this._initializeLogging(this._data.hub.web);
      const templateInfo = await this._getTemplateInfoFromModal();
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _initializeSetup: Template selected by user', data: { selectedTemplate: templateInfo.selectedTemplate.title }, level: LogLevel.Info });
      ReactDOM.unmountComponentAtNode(this._templateSelectModalContainer);
      this._data = { ...this._data, ...templateInfo };
      this._taskParams.data = this._data;
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _initializeSetup: Rendering progress modal', data: { selectedTemplate: templateInfo.selectedTemplate.title }, level: LogLevel.Info });
      this._renderProgressModal({ text: strings.ProgressModalLabel, subText: strings.ProgressModalDescription, iconName: 'Page' });
      await this._startProvision();
      await this._deleteCustomizer(this.componentId, true);
    } catch (error) {
      this._renderErrorModal({ error });
    }
  }

  /**
   * Init logging
   * 
   * @param {Web} hubWeb Hub web
   * @param {string} listName List name
   */
  protected _initializeLogging(hubWeb: Web, listName: string = 'Logg') {
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
  private _getTemplateInfoFromModal(): Promise<ITemplateSelectModalState> {
    return new Promise(resolve => {
      const templateSelectModal = React.createElement<ITemplateSelectModalProps>(TemplateSelectModal, {
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
  private _renderProgressModal(props: IProgressModalProps) {
    const progressModal = React.createElement<IProgressModalProps>(ProgressModal, {
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
  private _renderErrorModal(props: IErrorModalProps) {
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
  private async _startProvision(): Promise<void> {
    Logger.log({ message: '(ProjectSetupApplicationCustomizer) _startProvision', data: { properties: this.properties, tasks: Tasks.map(t => t.taskName) }, level: LogLevel.Info });
    try {
      await ListLogger.write('Starting provisioning of project.', 'Info');
      this._taskParams.templateSchema = await this._taskParams.data.selectedTemplate.getSchema();
      for (let i = 0; i < Tasks.length; i++) {
        if (isArray(this.properties.tasks) && this.properties.tasks.indexOf(Tasks[i].taskName) === -1) continue;
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) _startProvision: Executing task ${Tasks[i].taskName}`, level: LogLevel.Info });
        this._taskParams = await Tasks[i].execute(this._taskParams, this._onTaskStatusUpdated.bind(this));
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
  private _onTaskStatusUpdated(status: string, iconName: string) {
    this._renderProgressModal({ text: strings.ProgressModalLabel, subText: status, iconName });
  }

  /**
   * Delete customizer
   * 
   * @param {string} componentId Component ID
   * @param {boolean} reload Reload page after customizer removal
   */
  private async _deleteCustomizer(componentId: string, reload: boolean): Promise<void> {
    let customActions = await sp.web.userCustomActions.get<{ Id: string, ClientSideComponentId: string }[]>();
    for (let i = 0; i < customActions.length; i++) {
      var customAction = customActions[i];
      if (customAction.ClientSideComponentId === componentId) {
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) _deleteCustomizer: Deleting custom action ${customAction.Id}`, level: LogLevel.Info });
        await sp.web.userCustomActions.getById(customAction.Id).delete();
        break;
      }
    }
    if (reload) {
      window.location.href = window.location.href;
    }
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectSetupApplicationCustomizerData> {
    try {
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _fetchData: Retrieving required data for setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      await MSGraphHelper.Init(this.context.msGraphClientFactory);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _fetchData: Retrieving hub site url', data: {}, level: LogLevel.Info });
      let data: IProjectSetupApplicationCustomizerData = {};
      data.hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
      this._hubConfigurationService = new HubConfigurationService(data.hub.web);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _fetchData: Retrieved hub site url', data: { hubUrl: data.hub.url }, level: LogLevel.Info });
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _fetchData: Retrieving templates, extensions and content config', data: {}, level: LogLevel.Info });
      const [templates, extensions, listContentConfig] = await Promise.all([
        this._hubConfigurationService.getHubFiles<ProjectTemplate>(this.properties.templatesLibrary, ProjectTemplate),
        this._hubConfigurationService.getHubFiles<ProjectTemplate>(this.properties.extensionsLibrary, ProjectTemplate),
        this._hubConfigurationService.getHubItems<ListContentConfig>(this.properties.contentConfigList, ListContentConfig),
      ]);
      Logger.log({ message: '(ProjectSetupApplicationCustomizer) _fetchData: Retrieved templates, extensions and content config', data: { templates: templates.length, extensions: extensions.length, listContentConfig: listContentConfig.length }, level: LogLevel.Info });
      return {
        ...data,
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
  private _isDebug(): boolean {
    return document.location.search.toLowerCase().indexOf('debugmanifestsfile') !== -1;
  }
}
