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

/** Applies the selected template and extensions while collecting engine diagnostics. */
export class ApplyTemplate extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('ApplyTemplate', data)
  }

  /**
   * Provisions non-hook schemas, letting extensions replace any menus they declare.
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
      const packageSchema =
        isTemplateApplied && params.packageTemplateSchema
          ? (_.omit(params.packageTemplateSchema, params.templateExcludeHandlers) as Schema)
          : undefined
      // Before a menu is left out for a later layer: the setup adds back only the saved nodes
      // that none of these declare.
      params.declaredQuickLaunch = [
        schema,
        packageSchema,
        ...extensions.map((extension) => extension.schema)
      ]
        .map((declaring) => declaring?.Navigation?.QuickLaunch)
        .filter(Array.isArray)

      if (isTemplateApplied) {
        this.logInformation('Applying template to site', { parameters: params.templateParameters })
        const templateText = format(strings.ApplyTemplateText, this.data.selectedTemplate.text)
        const logNavigation = (message: string) =>
          onProgress(templateText, strings.ApplyTemplateNavigation, 'MiniLink', {
            message,
            level: 'info'
          })
        // The template first, then a catalog template's own on top of it. Each leaves out the
        // menus a later layer declares, as the engine would make them match that layer's.
        const layers = [
          this._omitNavigationDeclaredBy(
            schema,
            "the template's",
            { packageSchema, extensions },
            logNavigation
          )
        ]
        if (packageSchema) {
          layers.push(
            this._omitNavigationDeclaredBy(
              packageSchema,
              "the package template's",
              { extensions },
              logNavigation
            )
          )
        }
        for (const [index, layer] of layers.entries()) {
          if (index > 0) {
            this.logInformation('Applying the package template on top of the template')
            onProgress(templateText, '', 'Page', {
              message: 'Applying the package template on top of the template',
              level: 'info'
            })
          }
          progress = [templateText, '', 'Page']
          await captureEngineLog(
            () =>
              provisioner.applyTemplate(layer, null, (handler) => {
                if (APPLY_TEMPLATE_STATUS_MAP.has(handler)) {
                  const { text, iconName, getLogMessages } = APPLY_TEMPLATE_STATUS_MAP.get(handler)!
                  progress = [templateText, text, iconName]
                  onProgress(templateText, text, iconName, {
                    message: `Applying handler: ${handler} - ${text}`,
                    level: 'info'
                  })
                  getLogMessages?.(layer).forEach((message) => {
                    onProgress(templateText, text, iconName, { message, level: 'info' })
                  })
                }
              }),
            logEngineEntry,
            LOG_PREFIX
          )
        }
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
   * Omits the menus a later layer replaces (a package's own template, an extension), avoiding
   * links that layer deletes. Otherwise a deleted link target can fail the template before the
   * later layer runs.
   *
   * @param schema The schema to leave the menus out of
   * @param whose Whose menu it is, for the log line (`the template's`)
   * @param declaring The later layers
   * @param log Adds a line to the step's log
   */
  private _omitNavigationDeclaredBy(
    schema: Schema,
    whose: string,
    declaring: { packageSchema?: Schema; extensions: IExtensionSchema[] },
    log: (message: string) => void
  ): Schema {
    if (!schema.Navigation) return schema
    const navigation = { ...schema.Navigation }
    for (const collection of NAVIGATION_COLLECTIONS) {
      if (navigation[collection] === undefined) continue
      const declarers: string[] = []
      if (Array.isArray(declaring.packageSchema?.Navigation?.[collection])) {
        declarers.push("the package's own template")
      }
      const extensions = declaring.extensions.filter(({ schema: extensionSchema }) =>
        Array.isArray(extensionSchema.Navigation?.[collection])
      )
      if (extensions.length > 0) {
        declarers.push(
          `the extension ${extensions.map(({ extension }) => extension.text).join(', ')}`
        )
      }
      if (declarers.length === 0) continue
      delete navigation[collection]
      const message = `Skipping ${whose} Navigation ${collection}: ${declarers.join(' and ')} ${
        declarers.length > 1 ? 'declare' : 'declares'
      } it`
      this.logInformation(message)
      log(message)
    }
    return Object.keys(navigation).length > 0
      ? { ...schema, Navigation: navigation }
      : (_.omit(schema, 'Navigation') as Schema)
  }
}
