import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import MSGraphHelper from 'msgraph-helper';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HubSiteService from 'sp-hubsite-service';
import ListLogger from '../../../../@Shared/lib/logging/ListLogger';
import injectStyles from '../../../../@Shared/lib/util/injectStyles';
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
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) onInit: Initializing pre-conditionals before initializing setup', level: LogLevel.Info });
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
      injectStyles(`.SPPageChrome { opacity: 0.4; } .SPCanvas { visibility: hidden; } `);
      this._data = await this.getData();
      this.initLogging(this._data.hub.web);
      const templateInfo = await this.getTemplateInfo();
      ReactDOM.unmountComponentAtNode(this._templateSelectModalContainer);
      this._data = { ...this._data, ...templateInfo };
      this._taskParams = {
        context: this.context,
        properties: this.properties,
        data: this._data,
        templateParameters: { fieldsgroup: strings.SiteFieldsGroupName },
      };
      this.renderProgressModal({ text: strings.ProgressModalLabel, subText: strings.ProgressModalDescription, iconName: 'Page' });
      await this.runTasks();
    } catch (error) {
      await ListLogger.write(`${error.taskName} failed with message ${error.message}`, 'Error');
      this.renderErrorModal({ error });
    }
  }

  /**
   * Init logging
   * 
   * @param {Web} hubWeb Hub web
   * @param {string} listName List name
   */
  protected initLogging(hubWeb: any, listName: string = 'Logg') {
    ListLogger.init(
      hubWeb.lists.getByTitle(listName), {
        webUrl: 'GtLogWebUrl',
        scope: 'GtLogScope',
        functionName: 'GtLogFunctionName',
        message: 'GtLogMessage',
        level: 'GtLogLevel',
      },
      document.location.href,
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
  * Run tasks
  */
  private async runTasks(): Promise<void> {
    Logger.log({ message: '(ProjectSetupApplicationCustomizer) runTasks', data: { properties: this.properties, tasks: Tasks.map(t => t.name) }, level: LogLevel.Info });
    try {
      await ListLogger.write('Starting provisioning of project.');
      this._taskParams.templateSchema = await this._taskParams.data.selectedTemplate.getSchema();
      for (let i = 0; i < Tasks.length; i++) {
        this._taskParams = await Tasks[i].execute(this._taskParams, this.onTaskStatusUpdated);
      }
      await ListLogger.write('Project successfully provisioned.');
      await this.removeCustomizer(this.componentId, !this.isDebug());
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
  @autobind
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
   * Get _data
   */
  private async getData(): Promise<IProjectSetupApplicationCustomizerData> {
    try {
      await MSGraphHelper.Init(this.context.msGraphClientFactory);
      let _data: IProjectSetupApplicationCustomizerData = {};
      _data.hub = await HubSiteService.GetHubSiteById(this.context.pageContext.web.absoluteUrl, this.context.pageContext.legacyPageContext.hubSiteId);
      const [templates, extensions, listContentConfig] = await Promise.all([
        getHubFiles(_data.hub, this.properties.templatesLibrary, ProjectTemplate),
        getHubFiles(_data.hub, this.properties.extensionsLibrary, ProjectTemplate),
        getHubItems(_data.hub, this.properties.contentConfigList, ListContentConfig),
      ]);
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
