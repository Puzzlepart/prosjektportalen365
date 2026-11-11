import * as strings from 'ProjectExtensionsStrings'
import { ProjectExtension, format } from 'pp365-shared-library'
import { Schema, WebProvisioner } from 'sp-js-provisioning'
import _ from 'underscore'
import { IProjectSetupData } from '../../types'
import { NO_TEMPLATE_ID } from '../../constants'
import { BaseTask, IBaseTaskParams, captureEngineLog, engineLogLevel } from '../@BaseTask'
import { ILogEntry, OnProgressCallbackFunction } from '../types'
import { APPLY_TEMPLATE_STATUS_MAP, ApplyTemplateTaskError } from './types'

/**
 * The prefix of the engine's log lines from this task, left out of the lines in the advanced log.
 */
const LOG_PREFIX = '(ProjectSetup) (ApplyTemplate)'

/**
 * The menus a template's `Navigation` can declare. The engine makes each menu a template declares
 * match that template's nodes, and leaves the other one as it is.
 */
const NAVIGATION_COLLECTIONS = ['QuickLaunch', 'TopNavigationBar'] as const

/**
 * A selected extension with its schema, read once before anything is applied.
 */
interface IExtensionSchema {
  extension: ProjectExtension
  schema: Schema
}

export class ApplyTemplate extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('ApplyTemplate', data)
  }

  /**
   * Execute ApplyTemplate. The engine's warnings and errors are added to the step's log as they
   * are logged.
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    try {
      const provisioner = new WebProvisioner(params.web).setup({
        spfxContext: params.context,
        logging: {
          prefix: LOG_PREFIX,
          activeLogLevel: engineLogLevel()
        }
      })
      // What the step shows while the engine runs; its warnings and errors are logged under it.
      let progress: [string, string, string] = ['', '', '']
      const logEngineEntry = (entry: ILogEntry) => onProgress(...progress, entry)
      const extensions: IExtensionSchema[] = []
      for (const extension of this.data.selectedExtensions) {
        const schema = await extension.getSchema()
        extensions.push({ extension, schema: _.omit(schema, 'Hooks') as Schema })
      }
      const isTemplateApplied =
        this.data.selectedTemplate && this.data.selectedTemplate.id !== NO_TEMPLATE_ID
      const schema = isTemplateApplied
        ? (_.omit(params.templateSchema, params.templateExcludeHandlers) as Schema)
        : undefined
      // Before the template's menu is left out for an extension: the setup adds back only the
      // saved nodes that none of these declare.
      params.declaredQuickLaunch = [schema, ...extensions.map((extension) => extension.schema)]
        .map((declaring) => declaring?.Navigation?.QuickLaunch)
        .filter(Array.isArray)

      if (isTemplateApplied) {
        this.logInformation('Applying template to site', { parameters: params.templateParameters })
        const templateText = format(strings.ApplyTemplateText, this.data.selectedTemplate.text)
        const templateSchema = this._omitNavigationOfExtensions(schema, extensions, (message) =>
          onProgress(templateText, strings.ApplyTemplateNavigation, 'MiniLink', {
            message,
            level: 'info'
          })
        )
        progress = [templateText, '', 'Page']
        await captureEngineLog(
          () =>
            provisioner.applyTemplate(templateSchema, null, (handler) => {
              if (APPLY_TEMPLATE_STATUS_MAP.has(handler)) {
                const { text, iconName, getLogMessages } = APPLY_TEMPLATE_STATUS_MAP.get(handler)!
                progress = [templateText, text, iconName]
                onProgress(templateText, text, iconName, {
                  message: `Applying handler: ${handler} - ${text}`,
                  level: 'info'
                })
                getLogMessages?.(templateSchema).forEach((message) => {
                  onProgress(templateText, text, iconName, { message, level: 'info' })
                })
              }
            }),
          logEngineEntry,
          LOG_PREFIX
        )
      } else {
        this.logInformation('Skipping template application (no template selected)')
      }

      this.logInformation('Applying extensions to site', { parameters: params.templateParameters })
      for (const { extension, schema } of extensions) {
        progress = [
          strings.ApplyingExtensionsText,
          format(strings.ApplyExtensionText, extension.text),
          'ExternalBuild'
        ]
        onProgress(...progress, {
          message: `Applying extension: ${extension.text}`,
          level: 'info'
        })
        await captureEngineLog(
          () => provisioner.applyTemplate(schema, null),
          logEngineEntry,
          LOG_PREFIX
        )
      }
      return params
    } catch (error) {
      throw new ApplyTemplateTaskError(error)
    }
  }

  /**
   * The template without each menu of its `Navigation` that a selected extension declares too.
   * Each `applyTemplate` makes a menu it declares match its own nodes, so on every run the template
   * added the nodes the extension then deleted, and the template's step failed before the
   * extension ran when the target of one of those nodes had been deleted. The extensions are
   * applied after the template, so their menu is the one the project gets, as before.
   *
   * @param schema The template's schema
   * @param extensions The selected extensions with their schemas
   * @param log Adds a line to the step's log
   */
  private _omitNavigationOfExtensions(
    schema: Schema,
    extensions: IExtensionSchema[],
    log: (message: string) => void
  ): Schema {
    if (!schema.Navigation) return schema
    const navigation = { ...schema.Navigation }
    for (const collection of NAVIGATION_COLLECTIONS) {
      const declaring = extensions.filter(({ schema: extensionSchema }) =>
        Array.isArray(extensionSchema.Navigation?.[collection])
      )
      if (navigation[collection] === undefined || declaring.length === 0) continue
      delete navigation[collection]
      const message = `Skipping the template's Navigation ${collection}: the extension ${declaring
        .map(({ extension }) => extension.text)
        .join(', ')} declares it`
      this.logInformation(message)
      log(message)
    }
    return Object.keys(navigation).length > 0
      ? { ...schema, Navigation: navigation }
      : (_.omit(schema, 'Navigation') as Schema)
  }
}
