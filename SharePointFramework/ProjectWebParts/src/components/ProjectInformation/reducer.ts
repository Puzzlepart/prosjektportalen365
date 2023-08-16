import { createAction, createReducer } from '@reduxjs/toolkit'
import { IProjectInformationData } from 'pp365-shared-library'
import { CustomError, ProjectInformationField } from 'pp365-shared-library/lib/models'
import { useMemo, useReducer } from 'react'
import { IProgressDialogProps } from './ProgressDialog/types'
import {
  IProjectInformationState,
  ProjectInformationDialogType,
  ProjectInformationPanelType
} from './types'
import { WebPartContext } from '@microsoft/sp-webpart-base'

const initialState: IProjectInformationState = {
  isDataLoaded: false,
  properties: [],
  data: { sections: [], fields: [] }
}

export const INIT_DATA = createAction<{
  state: Partial<IProjectInformationState>
  error?: CustomError
}>('INIT_DATA')
export const UPDATE_DATA = createAction<{ data: IProjectInformationData }>('UPDATE_DATA')
export const FETCH_DATA_ERROR = createAction<{ error: CustomError }>('FETCH_DATA_ERROR')
export const SET_PROGRESS = createAction<IProgressDialogProps>('SET_PROGRESS')
export const OPEN_PANEL = createAction<ProjectInformationPanelType>('OPEN_PANEL')
export const CLOSE_PANEL = createAction('CLOSE_PANEL')
export const OPEN_DIALOG = createAction<ProjectInformationDialogType>('OPEN_DIALOG')
export const CLOSE_DIALOG = createAction('CLOSE_DIALOG')
export const PROPERTIES_UPDATED = createAction<{ refetch: boolean }>('PROPERTIES_UPDATED')

/**
 * Create properties from the `state`. Also `webPartContext` is needed to get the current locale.
 *
 * @param state State of the `ProjectInformation` component.
 * @param webPartContext SPFx web part context
 */
function createProperties(state: IProjectInformationState, webPartContext: WebPartContext) {
  const currentLocale = webPartContext.pageContext.cultureInfo.currentUICultureName.toLowerCase()
  // eslint-disable-next-line no-console
  console.log('createProperties', currentLocale)
  return state.data.fields
    .map((field) =>
      // .useConfiguration('program', currentLocale)
      new ProjectInformationField(field).init(state.data.columns).setValue(state.data)
    )
    .sort((a, b) => {
      if (!a.column) return 1
      if (!b.column) return -1
      return a.column.sortOrder - b.column.sortOrder
    })
}

/**
 * Create project information reducer.
 * 
 * @param webPartContext SPFx web part context
 */
const createProjectInformationReducer = (webPartContext: WebPartContext) =>
  createReducer(initialState, (builder) =>
    builder
      .addCase(INIT_DATA, (state, action) => {
        state.data = action.payload.state.data
        state.properties = action.payload.state.properties
        state.isProjectDataSynced = action.payload.state.isProjectDataSynced
        state.isParentProject = action.payload.state.isParentProject
        state.userHasEditPermission = action.payload.state.userHasEditPermission
        state.properties = createProperties(state as IProjectInformationState, webPartContext)
        state.isDataLoaded = true
      })
      .addCase(UPDATE_DATA, (state, action) => {
        state.data = {
          ...(state.data ?? {}),
          ...action.payload.data
        }
        state.properties = createProperties(state as IProjectInformationState, webPartContext)
      })
      .addCase(FETCH_DATA_ERROR, (state, action) => {
        state.error = action.payload.error
        state.isDataLoaded = true
      })
      .addCase(SET_PROGRESS, (state, action) => {
        state.progressDialog = action.payload as any
      })
      .addCase(OPEN_PANEL, (state, action) => {
        state.activePanel = action.payload
      })
      .addCase(CLOSE_PANEL, (state) => {
        state.activePanel = null
      })
      .addCase(OPEN_DIALOG, (state, action) => {
        state.activeDialog = action.payload
      })
      .addCase(CLOSE_DIALOG, (state) => {
        state.activeDialog = null
      })
      .addCase(PROPERTIES_UPDATED, (state, action) => {
        if (action.payload.refetch) {
          state.propertiesLastUpdated = new Date()
        }
      })
  )

/**
 * Hook to use project information reducer. This hook is used to
 * manage project information state using `useReducer` hook from
 * `react`.
 * 
 * @param webPartContext SPFx web part context
 */
export const useProjectInformationReducer = (webPartContext: WebPartContext) => {
  const reducer = useMemo(() => createProjectInformationReducer(webPartContext), [])
  const [state, dispatch] = useReducer(reducer, initialState)
  return {
    state,
    dispatch
  } as const
}
