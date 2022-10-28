import { createAction, createReducer } from '@reduxjs/toolkit'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from 'models'
import { ProjectSetupSettings } from 'projectSetup/ProjectSetupSettings'
import { first, uniq } from 'underscore'
import { IProjectSetupData } from '../../projectSetup/types'
import { ITemplateSelectDialogState } from './types'

export const INIT = createAction('INIT')
export const ON_LIST_CONTENT_CONFIG_CHANGED = createAction<ListContentConfig[]>(
  'ON_LIST_CONTENT_CONFIG_CHANGED'
)
export const ON_EXTENSIONS_CHANGED = createAction<ProjectExtension[]>('ON_EXTENTIONS_CHANGED')
export const ON_TEMPLATE_CHANGED = createAction<ProjectTemplate>('ON_TEMPLATE_CHANGED')

export const initState = (): ITemplateSelectDialogState => ({
  selectedTemplate: null,
  selectedListContentConfig: [],
  selectedExtensions: [],
  settings: new ProjectSetupSettings().useDefault()
})

export default (data: IProjectSetupData) =>
  createReducer(initState(), {
    [INIT.type]: (state: ITemplateSelectDialogState) => {
      let [selectedTemplate] = data.templates.filter((tmpl) => tmpl.isDefault)
      if (!selectedTemplate) selectedTemplate = first(data.templates)
      state.selectedTemplate = selectedTemplate
      state.selectedListContentConfig = data.listContentConfig.filter(
        (lcc) => lcc.isDefault || selectedTemplate.listContentConfigIds?.some((id) => id === lcc.id)
      )
      state.selectedExtensions = data.extensions.filter(
        (ext) => ext.isDefault || selectedTemplate.extensionIds?.some((id) => id === ext.id)
      )
    },
    [ON_LIST_CONTENT_CONFIG_CHANGED.type]: (
      state: ITemplateSelectDialogState,
      { payload }: ReturnType<typeof ON_LIST_CONTENT_CONFIG_CHANGED>
    ) => {
      const mandatorylistContentConfig = data.listContentConfig.filter((lcc) =>
        lcc.isMandatory(state.selectedTemplate)
      )
      state.selectedListContentConfig = uniq(
        [...mandatorylistContentConfig, ...payload],
        (lcc) => lcc.id
      )
    },
    [ON_EXTENSIONS_CHANGED.type]: (
      state: ITemplateSelectDialogState,
      { payload }: ReturnType<typeof ON_EXTENSIONS_CHANGED>
    ) => {
      const mandatoryExtensions = data.extensions.filter((ext) =>
        ext.isMandatory(state.selectedTemplate)
      )
      state.selectedExtensions = uniq([...mandatoryExtensions, ...payload], (lcc) => lcc.id)
    },
    [ON_TEMPLATE_CHANGED.type]: (
      state: ITemplateSelectDialogState,
      { payload: template }: ReturnType<typeof ON_TEMPLATE_CHANGED>
    ) => {
      state.selectedTemplate = template
      state.selectedListContentConfig = data.listContentConfig.filter(
        (lcc) => lcc.isDefault || template?.listContentConfigIds?.some((id) => id === lcc.id)
      )
      state.selectedExtensions = data.extensions.filter(
        (ext) => ext.isDefault || template?.extensionIds?.some((id) => id === ext.id)
      )
    }
  })
