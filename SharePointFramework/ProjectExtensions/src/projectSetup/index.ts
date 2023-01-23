import { MessageBarType } from '@fluentui/react'
import { override } from '@microsoft/decorators'
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base'
import { isArray, stringIsNullOrEmpty } from '@pnp/common'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { MenuNode, sp, Web } from '@pnp/sp'
import { format, getId } from '@uifabric/utilities'
import { SPDataAdapter } from 'data'
import { default as MSGraphHelper } from 'msgraph-helper'
import { ListLogger } from 'pp365-shared/lib/logging'
import { PortalDataService } from 'pp365-shared/lib/services'
import * as strings from 'ProjectExtensionsStrings'
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { find, uniq } from 'underscore'
import {
  ErrorDialog,
  IErrorDialogProps,
  IProgressDialogProps,
  ITemplateSelectDialogProps,
  ITemplateSelectDialogState,
  ProgressDialog,
  TemplateSelectDialog
} from '../components'
import { ContentConfig, ProjectExtension, ProjectTemplate, ProjectTemplateFile } from '../models'
import { deleteCustomizer } from './deleteCustomizer'
import { ProjectSetupError } from './ProjectSetupError'
import { ProjectSetupSettings } from './ProjectSetupSettings'
import * as Tasks from './tasks'
import { IProjectSetupData, IProjectSetupProperties, ProjectSetupValidation } from './types'

export default class ProjectSetup extends BaseApplicationCustomizer<IProjectSetupProperties> {
  private _portal: PortalDataService
  private _isSetup = true
  private _placeholderIds = {
    ErrorDialog: getId('errordialog'),
    ProgressDialog: getId('progressdialog'),
    TemplateSelectDialog: getId('templateselectdialog')
  }

  @override
  public async onInit(): Promise<void> {
    sp.setup({ spfxContext: this.context })
    Logger.subscribe(new ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning
    if (
      !this.context.pageContext.legacyPageContext.isSiteAdmin ||
      !this.context.pageContext.legacyPageContext.groupId
    )
      return
    try {
      this._isSetup = await this._isProjectSetup()

      // eslint-disable-next-line default-case
      switch (this._validation) {
        case ProjectSetupValidation.InvalidWebLanguage: {
          await deleteCustomizer(this.context.pageContext.web.absoluteUrl, this.componentId, false)
          throw new ProjectSetupError(
            'InvalidWebLanguage',
            strings.InvalidLanguageErrorMessage,
            strings.InvalidLanguageErrorStack
          )
        }
        case ProjectSetupValidation.IsHubSite: {
          await deleteCustomizer(this.context.pageContext.web.absoluteUrl, this.componentId, false)
          throw new ProjectSetupError(
            'IsHubSite',
            strings.IsHubSiteErrorMessage,
            strings.IsHubSiteErrorStack
          )
        }
        case ProjectSetupValidation.NoHubConnection: {
          throw new ProjectSetupError(
            'NoHubConnection',
            strings.NoHubSiteErrorMessage,
            strings.NoHubSiteErrorStack,
            MessageBarType.warning
          )
        }
        case ProjectSetupValidation.AlreadySetup: {
          if (stringIsNullOrEmpty(this.properties.forceTemplate)) {
            throw new ProjectSetupError(
              'AlreadySetup',
              strings.ProjectAlreadySetupMessage,
              strings.ProjectAlreadySetupStack
            )
          }
        }
      }

      this._initializeSetup({
        web: new Web(this.context.pageContext.web.absoluteUrl) as any,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        templateExcludeHandlers: [],
        context: this.context,
        properties: this.properties
      })
    } catch (error) {
      this._renderErrorDialog({ error })
    }
  }

  private async _ensureParentProjectPatch(): Promise<void> {
    const [singleItem] = await SPDataAdapter.portal.web.lists
      .getByTitle(this.properties.projectsList)
      .items.filter(
        `GtSiteId eq '${this.context.pageContext.legacyPageContext.siteId.replace(/([{}])/g, '')}'`
      )
      .get()
    await SPDataAdapter.portal.web.lists
      .getByTitle(this.properties.projectsList)
      .items.getById(singleItem.Id)
      .update({ GtIsParentProject: true })
  }

  /**
   * Intiialize setup
   *
   * @param taskParams - Task params
   */
  private async _initializeSetup(taskParams: Tasks.IBaseTaskParams) {
    try {

      await SPDataAdapter.configure(this.context, {
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl
      })

      let data = await this._fetchData()
      ListLogger.init(
        SPDataAdapter.portal.web.lists.getByTitle('Logg'),
        this.context.pageContext.web.absoluteUrl,
        'ProjectSetup'
      )
      const provisioningInfo = await this._getProvisioningInfo(data)
      data = { ...data, ...provisioningInfo }
      this._renderProgressDialog({
        progressIndicator: {
          label: strings.ProgressDialogLabel,
          description: strings.ProgressDialogDescription
        },
        iconName: data.selectedTemplate?.iconProps?.iconName ?? 'Page',
        dialogContentProps: this.properties.progressDialogContentProps
      })
      await this._startProvision(taskParams, data)

      if (!stringIsNullOrEmpty(this.properties.forceTemplate)) {
        await this.recreateNavMenu()
        await sp.web.lists
          .getByTitle(strings.ProjectPropertiesListName)
          .items.getById(1)
          .update({ GtIsParentProject: true, GtChildProjects: JSON.stringify([]) })
        await this._ensureParentProjectPatch()
      }

      await deleteCustomizer(
        this.context.pageContext.web.absoluteUrl,
        this.componentId,
        !this.properties.skipReload
      )
    } catch (error) {
      this._renderErrorDialog({ error })
    }
  }

  /**
   * Adds the old custom navigation nodes to the quick launch menu
   */
  private async recreateNavMenu() {
    const oldNodes: MenuNode[] = await JSON.parse(localStorage.getItem('pp_navigationNodes'))
    const navigationNodes = uniq([...oldNodes])
    for await (const node of navigationNodes) {
      if (node.Title === strings.RecycleBinText) {
        continue
      }
      const addedNode = await sp.web.navigation.quicklaunch.add(node.Title, node.SimpleUrl)
      if (node.Nodes.length > 0) {
        for await (const childNode of node.Nodes) {
          await addedNode.node.children.add(childNode.Title, childNode.SimpleUrl)
        }
      }
    }
  }

  /**
   * Checks for force template
   *
   * @param data - Data
   */
  private _checkForceTemplate(data: IProjectSetupData): ITemplateSelectDialogState {
    if (stringIsNullOrEmpty(this.properties.forceTemplate)) return null
    const selectedTemplate = find(
      data.templates,
      (tmpl) => tmpl.text === this.properties.forceTemplate
    )
    if (!selectedTemplate) return null
    return {
      selectedTemplate,
      selectedExtensions: [],
      selectedContentConfig: [],
      settings: new ProjectSetupSettings().useDefault()
    }
  }

  /**
   * Get provisioning info from TemplateSelectDialog
   *
   * @param data - Data
   */
  private _getProvisioningInfo(data: IProjectSetupData): Promise<ITemplateSelectDialogState> {
    return new Promise((resolve, reject) => {
      const placeholder = this._getPlaceholder('TemplateSelectDialog')
      const forceTemplate = this._checkForceTemplate(data)
      if (forceTemplate !== null) {
        this._unmount(placeholder)
        resolve(forceTemplate)
      } else {
        const element = createElement<ITemplateSelectDialogProps>(TemplateSelectDialog, {
          data,
          version: this.version,
          tasks: this.properties.tasks,
          onSubmit: (state: ITemplateSelectDialogState) => {
            this._unmount(placeholder)
            resolve(state)
          },
          onDismiss: () => {
            this._unmount(placeholder)
            reject(
              new ProjectSetupError(
                '_getProvisioningInfo',
                strings.SetupAbortedText,
                strings.SetupAbortedText
              )
            )
          }
        })
        render(element, placeholder)
      }
    })
  }

  /**
   * Render ProgressDialog
   *
   * @param props - Props
   */
  private _renderProgressDialog(props: IProgressDialogProps) {
    const placeholder = this._getPlaceholder('ProgressDialog')
    const element = createElement<IProgressDialogProps>(ProgressDialog, {
      ...props,
      version: this.version
    })
    render(element, placeholder)
  }

  /**
   * Render ErrorDialog
   *
   * @param props - Props
   */
  private _renderErrorDialog(props: IErrorDialogProps) {
    const progressDialog = this._getPlaceholder('ProgressDialog')
    this._unmount(progressDialog)
    const placeholder = this._getPlaceholder('ErrorDialog')
    const element = createElement<IErrorDialogProps>(ErrorDialog, {
      ...props,
      version: this.version,
      onDismiss: async () => {
        if (this._isSetup) {
          await deleteCustomizer(this.context.pageContext.web.absoluteUrl, this.componentId, false)
        }
        this._unmount(placeholder)
      },
      messageType: props.error['messageType'],
      onSetupClick: () => {
        this._initializeSetup({
          web: new Web(this.context.pageContext.web.absoluteUrl) as any,
          webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
          templateExcludeHandlers: [],
          context: this.context,
          properties: this.properties
        })
        this._unmount(placeholder)
      }
    })
    render(element, placeholder)
  }

  /**
   * Start provision
   *
   * Get tasks using `Tasks.getTasks` and runs through them in sequence
   *
   * @param taskParams Task params
   * @param data Data
   */
  private async _startProvision(
    taskParams: Tasks.IBaseTaskParams,
    data: IProjectSetupData
  ): Promise<void> {
    const tasks = Tasks.getTasks(data)
    try {
      await ListLogger.log({
        message: format(
          strings.ProjectProvisioningStartLogText,
          this.context.pageContext.web.title
        ),
        functionName: '_startProvision',
        component: 'ProjectSetup'
      })
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        if (
          isArray(this.properties.tasks) &&
          ['PreTask', ...this.properties.tasks].indexOf(task.taskName) === -1
        )
          continue
        taskParams = await task.execute(taskParams, this._onTaskStatusUpdated.bind(this))
      }
      await ListLogger.log({
        message: format(
          strings.ProjectProvisioningSuccessLogText,
          this.context.pageContext.web.title
        ),
        functionName: '_startProvision',
        component: 'ProjectSetup'
      })
    } catch (error) {
      await ListLogger.log({
        message: error.message,
        functionName: '_startProvision',
        component: 'ProjectSetup',
        scope: error.name,
        level: 'Error'
      })
      throw error
    }
  }

  /**
   * On task status updated
   *
   * @param label - Progress label
   * @param description - Progress description
   * @param iconName - Icon name
   */
  private _onTaskStatusUpdated(label: string, description: string, iconName: string) {
    this._renderProgressDialog({
      progressIndicator: { label, description },
      iconName,
      dialogContentProps: this.properties.progressDialogContentProps
    })
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectSetupData> {
    try {
      await MSGraphHelper.Init(this.context.msGraphClientFactory)
      const data: IProjectSetupData = {}
      this._portal = await new PortalDataService().configure({
        pageContext: this.context.pageContext as any
      })
      const [_templates, extensions, contentConfig, templateFiles] = await Promise.all([
        this._portal.getItems(
          this.properties.templatesLibrary,
          ProjectTemplate,
          {
            ViewXml: '<View></View>'
          },
          ['FieldValuesAsText']
        ),
        this.properties.extensionsLibrary
          ? this._portal.getItems(
            this.properties.extensionsLibrary,
            ProjectExtension,
            {
              ViewXml:
                '<View Scope="RecursiveAll"><Query><Where><Eq><FieldRef Name="FSObjType" /><Value Type="Integer">0</Value></Eq></Where></Query></View>'
            },
            ['File', 'FieldValuesAsText']
          )
          : Promise.resolve([]),
        this.properties.contentConfigList
          ? this._portal.getItems(this.properties.contentConfigList, ContentConfig, {}, ['File'])
          : Promise.resolve([]),
        this._portal.getItems(
          strings.Lists_ProjectTemplateFiles_Title,
          ProjectTemplateFile,
          {
            ViewXml: '<View></View>'
          },
          ['File']
        )
      ])
      const templates = _templates.map((tmpl) => {
        const [tmplFile] = templateFiles.filter((file) => file.id === tmpl.projectTemplateId)
        tmpl.projectTemplateUrl = tmplFile?.serverRelativeUrl
        return tmpl
      })
      return {
        ...data,
        extensions,
        contentConfig,
        templates
      }
    } catch (error) {
      throw new ProjectSetupError(
        '_fetchData',
        strings.GetSetupDataErrorMessage,
        strings.GetSetupDataErrorStack
      )
    }
  }

  /**
   * Get validation
   */
  private get _validation(): ProjectSetupValidation {
    if (this.context.pageContext.web.language !== 1044)
      return ProjectSetupValidation.InvalidWebLanguage
    if (!this.context.pageContext.legacyPageContext.hubSiteId)
      return ProjectSetupValidation.NoHubConnection
    if (
      this.context.pageContext.legacyPageContext.siteId.includes(
        this.context.pageContext.legacyPageContext.hubSiteId
      )
    )
      return ProjectSetupValidation.IsHubSite
    if (this._isSetup) return ProjectSetupValidation.AlreadySetup
    return ProjectSetupValidation.Ready
  }

  /**
   * Unmount component at container
   *
   * @param container - HTML container elememnt
   */
  private _unmount(container: HTMLElement): boolean {
    return unmountComponentAtNode(container)
  }

  /**
   * Get container
   */
  private get _container(): HTMLDivElement {
    const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top)
    return topPlaceholder.domElement
  }

  /**
   * Get placeholder by key
   *
   * @param key - Key
   */
  private _getPlaceholder(key: 'ErrorDialog' | 'ProgressDialog' | 'TemplateSelectDialog') {
    const id = this._placeholderIds[key]
    let placeholder = document.getElementById(id)
    if (placeholder === null) {
      placeholder = document.createElement('DIV')
      placeholder.id = this._placeholderIds[key]
      placeholder.setAttribute('name', key)
      return this._container.appendChild(placeholder)
    }
    return placeholder
  }

  /**
   * Check if the project is previously set up.
   */
  private async _isProjectSetup() {
    const { WelcomePage } = await sp.web.rootFolder.select('WelcomePage').get()
    if (WelcomePage === 'SitePages/Home.aspx') return false
    return true
  }

  private get version() {
    return DEBUG ? 'Serving on localhost' : `v${this.manifest.version}`
  }
}

export { IProjectSetupData }
