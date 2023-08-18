import { WebPartContext } from '@microsoft/sp-webpart-base'
import { createReducer } from '@reduxjs/toolkit'
import { useMemo, useReducer } from 'react'
import { IProjectInformationState } from '../types'
import {
  CLOSE_DIALOG,
  CLOSE_PANEL,
  FETCH_DATA_ERROR,
  INIT_DATA,
  OPEN_DIALOG,
  OPEN_PANEL,
  PROPERTIES_UPDATED,
  SET_PROGRESS,
  UPDATE_DATA
} from './actions'
import { createProperties } from './createProperties'

/**
 * Initial state for the `ProjectInformation` component.
 *
 * - `isDataLoaded` is `false` by default, and it will be set to
 * `true` when the data is loaded.
 * - `properties` is an empty array by default, and it will be
 * set to the project properties when the data is loaded.
 * - `data` consists of an empty array of sections and fields by default,
 * and it will be set to the project data when the data is loaded.
 */
const initialState: IProjectInformationState = {
  isDataLoaded: false,
  properties: [],
  data: { sections: [], fields: [] }
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
  }
}

export * from './actions'
