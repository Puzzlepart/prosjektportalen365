import { MessageBarType } from '@fluentui/react'
import { override } from '@microsoft/decorators'
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base'
import { isArray, stringIsNullOrEmpty } from '@pnp/core'
import { ConsoleListener, LogLevel, Logger } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { IMenuNode } from '@pnp/sp/navigation'
import { format, getId } from '@uifabric/utilities'
import * as strings from 'ProjectExtensionsStrings'
import { SPDataAdapter } from 'data'
import { default as MSGraphHelper } from 'msgraph-helper'
import {
  ContentConfig,
  ListLogger,
  PortalDataService,
  ProjectExtension,
  ProjectTemplate,
  ProjectTemplateFile,
  createSpfiInstance
} from 'pp365-shared-library'
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import _ from 'underscore'
import {
  ErrorDialog,
  IErrorDialogProps,
  IProgressDialogProps,
  IProjectSetupDialogProps,
  IProjectSetupDialogState,
  ProgressDialog,
  ProjectSetupDialog
} from '../components'
import { ProjectSetupError } from './ProjectSetupError'
import { deleteCustomizer } from './deleteCustomizer'
import * as Tasks from './tasks'
import { IProjectSetupData, IProjectSetupProperties, ProjectSetupValidation } from './types'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning

export default class ProjectSetup extends BaseApplicationCustomizer<IProjectSetupProperties> {
  /**
   * Configured SPFI instance from `@pnp/sp`
   */
  public sp: SPFI
  private _portal: PortalDataService
  private _isSetup = true
  private _placeholderIds = {
    ErrorDialog: getId('errordialog'),
    ProgressDialog: getId('progressdialog'),
    TemplateSelectDialog: getId('templateselectdialog')
  }

  @override
  public async onInit(): Promise<void> {
    this.sp = createSpfiInstance(this.context)
    const { isSiteAdmin, groupId } = this.context.pageContext.legacyPageContext
    if (!isSiteAdmin || !groupId) return
    try {
      this._isSetup = await this._isProjectSetup()

      // eslint-disable-next-line default-case
      switch (this._validation) {
        case ProjectSetupValidation.InvalidWebLanguage: {
          await deleteCustomizer(this, false)
          throw new ProjectSetupError(
            'InvalidWebLanguage',
            strings.InvalidLanguageErrorMessage,
            strings.InvalidLanguageErrorStack
          )
        }
        case ProjectSetupValidation.IsHubSite: {
          await deleteCustomizer(this, false)
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
        sp: this.sp,
        web: this.sp.web,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        templateExcludeHandlers: ['Hooks'],
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
      )()
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
      const provisioningInfo = await this._getSetupInfo(data)
      data = { ...data, ...provisioningInfo }
      this._renderProgressDialog({
        progressIndicator: {
          label: strings.ProgressDialogLabel,
          description: strings.ProgressDialogDescription
        },
        iconName: data.selectedTemplate?.iconProps?.iconName ?? 'Page',
        dialogContentProps: this.properties.progressDialogContentProps
      })
      await this._startSetup(taskParams, data)

      if (!stringIsNullOrEmpty(this.properties.forceTemplate)) {
        await this.recreateNavMenu()
        await this.sp.web.lists
          .getByTitle(strings.ProjectPropertiesListName)
          .items.getById(1)
          .update({ GtIsParentProject: true, GtChildProjects: JSON.stringify([]) })
        await this._ensureParentProjectPatch()
      }

      await deleteCustomizer(this, !this.properties.skipReload)
    } catch (error) {
      this._renderErrorDialog({ error })
    }
  }

  /**
   * Adds the old custom navigation nodes to the quick launch menu
   */
  private async recreateNavMenu() {
    const oldNodes: IMenuNode[] = await JSON.parse(localStorage.getItem('pp_navigationNodes'))
    const navigationNodes = _.uniq([...oldNodes])
    for await (const node of navigationNodes) {
      if (node.Title === strings.RecycleBinText) {
        continue
      }
      const addedNode = await this.sp.web.navigation.quicklaunch.add(node.Title, node.SimpleUrl)
      if (node.Nodes.length > 0) {
        for await (const childNode of node.Nodes) {
          await addedNode.node.children.add(childNode.Title, childNode.SimpleUrl)
        }
      }
    }
  }

  /**
   * Checks for auto/force template. If found, returns the template
   * and sets the state accordingly. If not found, returns null.
   * The force/auto template can either be set in property
   * `forceTemplate` or as a property on the template item itself.
   *
   * To be able to use the force/auto template, the user must be a owner.
   *
   * @param data - Project setup data
   */
  private _checkAutoTemplate({ templates }: IProjectSetupData): IProjectSetupDialogState {
    const autoTemplate = _.find(
      templates,
      ({ text, autoConfigure }) => text === this.properties.forceTemplate || autoConfigure
    )
    if (!autoTemplate) return null
    return {
      selectedTemplate: autoTemplate,
      selectedExtensions: [],
      selectedContentConfig: []
    }
  }

  /**
   * Get setup info from `TemplateSelectDialog`
   *
   * @param data - Data
   */
  private _getSetupInfo(data: IProjectSetupData): Promise<IProjectSetupDialogState> {
    return new Promise((resolve, reject) => {
      const placeholder = this._getPlaceholder('TemplateSelectDialog')
      const autoTemplate = this._checkAutoTemplate(data)
      if (autoTemplate !== null) {
        this._unmount(placeholder)
        resolve(autoTemplate)
      } else {
        const element = createElement<IProjectSetupDialogProps>(ProjectSetupDialog, {
          data,
          version: this.version,
          tasks: this.properties.tasks,
          onSubmit: (state: IProjectSetupDialogState) => {
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
   * Render `ProgressDialog` passing the `props` aswell
   * as the current version of the extension (`this.version`)
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
   * Render `ErrorDialog` with a dismiss ation that removes the custom action
   * for this extension and then unmounts the dialog.
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
          await deleteCustomizer(this, false)
        }
        this._unmount(placeholder)
      },
      messageType: props.error['messageType'],
      onSetupClick: () => {
        this._initializeSetup({
          sp: this.sp,
          web: this.sp.web,
          webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
          templateExcludeHandlers: ['Hooks'],
          context: this.context,
          properties: this.properties
        })
        this._unmount(placeholder)
      }
    })
    render(element, placeholder)
  }

  /**
   * Start setup of the new project.
   *
   * Get tasks using `Tasks.getTasks` and runs through them in sequence
   * executing the `execute` method on each task.
   *
   * @param taskParams Task params
   * @param data Data
   */
  private async _startSetup(
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
   * Get templates from portal site. Checks for locked template in property bag,
   * and if found, returns only that template if it exists. Otherwise, returns all
   * templates from the templates library.
   *
   * @param propertyBagRegex - Regex to match property bag key for locked template
   */
  private async _getTemplates(propertyBagRegex = /^pp_.*_template$/): Promise<ProjectTemplate[]> {
    try {
      const webAllProperties = (
        await this.sp.web.select('Title', 'AllProperties').expand('AllProperties')()
      )['AllProperties']
      const lockedTemplateProperty = Object.keys(webAllProperties).find((key) =>
        propertyBagRegex.test(key)
      )

      const [lockedTemplateName, templates] = await Promise.all([
        webAllProperties[lockedTemplateProperty],
        this._portal.getItems(
          this.properties.templatesLibrary,
          ProjectTemplate,
          {
            ViewXml: '<View></View>'
          },
          ['FieldValuesAsText']
        )
      ])

      if (this.properties.forceTemplate) {
        return templates
      } else if (lockedTemplateName) {
        const lockedTemplate = templates.find((t) => t.text === lockedTemplateName)
        if (lockedTemplate) {
          lockedTemplate.isForced = true
          lockedTemplate.isLocked = true
          return [lockedTemplate]
        }
      }
      return templates
    } catch (error) {
      throw new Error(`Error getting templates: ${error.message}`)
    }
  }

  /**
   * Fetch data from SharePoint and initializes the `MSGraphHelper`. This is
   * called when the component is first loaded.
   */
  private async _fetchData(): Promise<IProjectSetupData> {
    try {
      await MSGraphHelper.Init(this.context.msGraphClientFactory)
      const data: IProjectSetupData = {}
      this._portal = await new PortalDataService().configure({
        spfxContext: this.context
      })

      const [_templates, extensions, contentConfig, templateFiles, customActions, ideaData] =
        await Promise.all([
          this._getTemplates(),
          this._portal.getItems(
            this.properties.extensionsLibrary,
            ProjectExtension,
            {
              ViewXml:
                '<View Scope="RecursiveAll"><Query><Where><Eq><FieldRef Name="FSObjType" /><Value Type="Integer">0</Value></Eq></Where></Query></View>'
            },
            ['File', 'FieldValuesAsText']
          ),
          this._portal.getItems(this.properties.contentConfigList, ContentConfig, {}, ['File']),
          this._portal.getItems(
            strings.ProjectTemplateFilesListName,
            ProjectTemplateFile,
            {
              ViewXml: '<View></View>'
            },
            ['File']
          ),
          this.sp.web.userCustomActions(),
          this._portal.getIdeaData()
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
        templates,
        customActions,
        ideaData
      } as IProjectSetupData
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
   * Get container element in `PlaceholderName.Top` placeholder
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
    const { WelcomePage } = await this.sp.web.rootFolder.select('WelcomePage')()
    if (WelcomePage === 'SitePages/Home.aspx') return false
    return true
  }

  /**
   * Returns the manifest version number, or 'Serving on localhost' if in debug mode.
   */
  private get version() {
    return DEBUG ? 'Serving on localhost' : `v${this.manifest.version}`
  }
}

export { IProjectSetupData }
