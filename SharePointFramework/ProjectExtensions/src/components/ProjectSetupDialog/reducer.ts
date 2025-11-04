import { createAction, createReducer } from '@reduxjs/toolkit'
import { ContentConfig, ProjectExtension, ProjectTemplate } from 'pp365-shared-library'
import { first, uniq } from 'underscore'
import { IProjectSetupData } from '../../extensions/projectSetup/types'
import { IProjectSetupDialogState } from './types'

export const INIT = createAction('INIT')
export const ON_LIST_CONTENT_CONFIG_CHANGED = createAction<ContentConfig[]>(
  'ON_LIST_CONTENT_CONFIG_CHANGED'
)
export const ON_EXTENSIONS_CHANGED = createAction<ProjectExtension[]>('ON_EXTENTIONS_CHANGED')
export const ON_TEMPLATE_CHANGED = createAction<ProjectTemplate>('ON_TEMPLATE_CHANGED')

export const initialState: IProjectSetupDialogState = {
  selectedTemplate: null,
  selectedContentConfig: [],
  selectedExtensions: []
}

/**
 * Create reducer for `TemplateSelectDialog`
 */
export default (data: IProjectSetupData) =>
  createReducer(initialState, {
    [INIT.type]: (state: IProjectSetupDialogState) => {
      let [template] = data.templates.filter((t) => t.isDefault)
      if (!template) template = first(data.templates)
      state.selectedTemplate = template
      state.selectedContentConfig = template?.getContentConfig(data.contentConfig) ?? []
      state.selectedExtensions = template?.getExtensions(data.extensions) ?? []
    },

    [ON_LIST_CONTENT_CONFIG_CHANGED.type]: (
      state: IProjectSetupDialogState,
      { payload }: ReturnType<typeof ON_LIST_CONTENT_CONFIG_CHANGED>
    ) => {
      const mandatoryContentConfig = data.contentConfig.filter((contentConfig) =>
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
      const mandatoryExtensions = data.extensions.filter((ext) =>
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
      state.selectedContentConfig = template?.getContentConfig(data.contentConfig) || []
      state.selectedExtensions = template?.getExtensions(data.extensions) || []
    }
  })
