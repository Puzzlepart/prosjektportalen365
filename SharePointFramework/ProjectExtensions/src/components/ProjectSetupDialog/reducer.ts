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
 * Create reducer for `ProjectSetupDialog`. Handlers that pass `state.selectedTemplate` to a
 * method type `state` as the plain state: immer's `Draft` drops `ProjectTemplate`'s private
 * members, so the draft is not accepted where a `ProjectTemplate` is expected.
 */
export default (data: IProjectSetupData) =>
  createReducer(initialState, (builder) =>
    builder
      .addCase(INIT, (state) => {
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
      })
      .addCase(ON_LIST_CONTENT_CONFIG_CHANGED, (state: IProjectSetupDialogState, { payload }) => {
        // For a cloud template the available set is the bundled (resolved) list content,
        // not the hub `data.contentConfig`.
        const available = state.selectedTemplate?.isCloudTemplate
          ? (state.resolvedCloudTemplate?.contentConfig ?? [])
          : data.contentConfig
        const mandatoryContentConfig = available.filter((contentConfig) =>
          contentConfig.isMandatoryForTemplate(state.selectedTemplate)
        )
        state.selectedContentConfig = uniq(
          [...mandatoryContentConfig, ...payload],
          (contentConfig) => contentConfig.id
        )
      })
      .addCase(ON_EXTENSIONS_CHANGED, (state: IProjectSetupDialogState, { payload }) => {
        const available = state.selectedTemplate?.isCloudTemplate
          ? (state.resolvedCloudTemplate?.extensions ?? [])
          : data.extensions
        const mandatoryExtensions = available.filter((ext) =>
          ext.isMandatoryForTemplate(state.selectedTemplate)
        )
        state.selectedExtensions = uniq(
          [...mandatoryExtensions, ...payload],
          (extension) => extension.id
        )
      })
      .addCase(ON_TEMPLATE_CHANGED, (state, { payload: template }) => {
        state.selectedTemplate = template
        state.resolvedCloudTemplate = undefined
        state.cloudTemplateError = undefined
        state.isResolvingCloudTemplate = false
        if (template?.isCloudTemplate) {
          state.selectedContentConfig = []
          state.selectedExtensions = []
        } else {
          state.selectedContentConfig = template?.getContentConfig(data.contentConfig) || []
          state.selectedExtensions = template?.getExtensions(data.extensions) || []
        }
      })
      .addCase(ON_CLOUD_TEMPLATE_RESOLVING, (state) => {
        state.isResolvingCloudTemplate = true
        state.cloudTemplateError = undefined
      })
      .addCase(ON_CLOUD_TEMPLATE_RESOLVED, (state: IProjectSetupDialogState, { payload }) => {
        // Ignore a stale resolution if the user has since changed the template.
        if (state.selectedTemplate?.id !== payload.templateId) return
        state.resolvedCloudTemplate = payload
        state.isResolvingCloudTemplate = false
        state.cloudTemplateError = undefined
        // Hidden items are not shown, but a hidden item that is mandatory for the
        // template (e.g. a locked bundled extension) must still be applied.
        state.selectedExtensions = payload.extensions.filter(
          (extension) =>
            !extension.hidden || extension.isMandatoryForTemplate(state.selectedTemplate)
        )
        state.selectedContentConfig = payload.contentConfig.filter(
          (contentConfig) =>
            !contentConfig.hidden || contentConfig.isMandatoryForTemplate(state.selectedTemplate)
        )
      })
      .addCase(ON_CLOUD_TEMPLATE_ERROR, (state, { payload }) => {
        state.isResolvingCloudTemplate = false
        state.cloudTemplateError = payload
      })
  )
