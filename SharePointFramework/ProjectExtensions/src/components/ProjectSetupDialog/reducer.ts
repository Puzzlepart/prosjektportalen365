import { createAction, createReducer } from '@reduxjs/toolkit'
import { ContentConfig, ProjectExtension, ProjectTemplate } from 'pp365-shared-library'
import { first, uniq } from 'underscore'
import { IProjectSetupData } from '../../extensions/projectSetup/types'
import { createNoTemplateOption } from '../../extensions/projectSetup/noTemplate'
import { IProjectSetupDialogState, IResolvedCloudTemplate } from './types'

export const INIT = createAction('INIT')
export const ON_LIST_CONTENT_CONFIG_CHANGED = createAction<ContentConfig[]>(
  'ON_LIST_CONTENT_CONFIG_CHANGED'
)
export const ON_EXTENSIONS_CHANGED = createAction<ProjectExtension[]>('ON_EXTENSIONS_CHANGED')
export const ON_TEMPLATE_CHANGED = createAction<ProjectTemplate>('ON_TEMPLATE_CHANGED')
export const ON_CLOUD_TEMPLATE_RESOLVING = createAction('ON_CLOUD_TEMPLATE_RESOLVING')
export const ON_CLOUD_TEMPLATE_RESOLVED = createAction<IResolvedCloudTemplate>(
  'ON_CLOUD_TEMPLATE_RESOLVED'
)
export const ON_CLOUD_TEMPLATE_ERROR = createAction<string>('ON_CLOUD_TEMPLATE_ERROR')

export const initialState: IProjectSetupDialogState = {
  selectedTemplate: null,
  selectedContentConfig: [],
  selectedExtensions: []
}

/**
 * Create reducer for `ProjectSetupDialog`
 */
export default (data: IProjectSetupData) =>
  createReducer(initialState, {
    [INIT.type]: (state: IProjectSetupDialogState) => {
      let template: ProjectTemplate
      if (data.hasExistingTemplate) {
        // When re-running the setup wizard, default to 'No template' to avoid accidentally applying a full template setup.
        template = createNoTemplateOption()
      } else {
        ;[template] = data.templates.filter((t) => t.isDefault)
        if (!template) template = first(data.templates)
      }
      state.selectedTemplate = template
      state.selectedContentConfig = template?.getContentConfig(data.contentConfig) ?? []
      state.selectedExtensions = template?.getExtensions(data.extensions) ?? []
    },

    [ON_LIST_CONTENT_CONFIG_CHANGED.type]: (
      state: IProjectSetupDialogState,
      { payload }: ReturnType<typeof ON_LIST_CONTENT_CONFIG_CHANGED>
    ) => {
      // For a skymal the available set is the bundled (resolved) list content,
      // not the hub `data.contentConfig`.
      const available = state.selectedTemplate?.isCloudTemplate
        ? state.resolvedCloudTemplate?.contentConfig ?? []
        : data.contentConfig
      const mandatoryContentConfig = available.filter((contentConfig) =>
        contentConfig.isMandatoryForTemplate(state.selectedTemplate)
      )
      state.selectedContentConfig = uniq(
        [...mandatoryContentConfig, ...payload],
        (contentConfig) => contentConfig.id
      )
    },

    [ON_EXTENSIONS_CHANGED.type]: (
      state: IProjectSetupDialogState,
      { payload }: ReturnType<typeof ON_EXTENSIONS_CHANGED>
    ) => {
      const available = state.selectedTemplate?.isCloudTemplate
        ? state.resolvedCloudTemplate?.extensions ?? []
        : data.extensions
      const mandatoryExtensions = available.filter((ext) =>
        ext.isMandatoryForTemplate(state.selectedTemplate)
      )
      state.selectedExtensions = uniq(
        [...mandatoryExtensions, ...payload],
        (contentConfig) => contentConfig.id
      )
    },

    [ON_TEMPLATE_CHANGED.type]: (
      state: IProjectSetupDialogState,
      { payload: template }: ReturnType<typeof ON_TEMPLATE_CHANGED>
    ) => {
      state.selectedTemplate = template
      // Switching templates always clears any prior skymal resolution.
      state.resolvedCloudTemplate = undefined
      state.cloudTemplateError = undefined
      state.isResolvingCloudTemplate = false
      if (template?.isCloudTemplate) {
        // Bundled extensions/list content aren't known until the .pppkg is
        // downloaded — populated by ON_CLOUD_TEMPLATE_RESOLVED.
        state.selectedContentConfig = []
        state.selectedExtensions = []
      } else {
        state.selectedContentConfig = template?.getContentConfig(data.contentConfig) || []
        state.selectedExtensions = template?.getExtensions(data.extensions) || []
      }
    },

    [ON_CLOUD_TEMPLATE_RESOLVING.type]: (state: IProjectSetupDialogState) => {
      state.isResolvingCloudTemplate = true
      state.cloudTemplateError = undefined
    },

    [ON_CLOUD_TEMPLATE_RESOLVED.type]: (
      state: IProjectSetupDialogState,
      { payload }: ReturnType<typeof ON_CLOUD_TEMPLATE_RESOLVED>
    ) => {
      // Ignore a stale resolution if the user has since changed the template.
      if (state.selectedTemplate?.id !== payload.templateId) return
      state.resolvedCloudTemplate = payload
      state.isResolvingCloudTemplate = false
      state.cloudTemplateError = undefined
      // Pre-select the bundled defaults (CloudProjectExtension/CloudContentConfig
      // carry `isDefault` from the manifest's `defaultSelected`/`default`).
      state.selectedExtensions = state.selectedTemplate?.getExtensions(payload.extensions) ?? []
      state.selectedContentConfig =
        state.selectedTemplate?.getContentConfig(payload.contentConfig) ?? []
    },

    [ON_CLOUD_TEMPLATE_ERROR.type]: (
      state: IProjectSetupDialogState,
      { payload }: ReturnType<typeof ON_CLOUD_TEMPLATE_ERROR>
    ) => {
      state.isResolvingCloudTemplate = false
      state.cloudTemplateError = payload
    }
  })
