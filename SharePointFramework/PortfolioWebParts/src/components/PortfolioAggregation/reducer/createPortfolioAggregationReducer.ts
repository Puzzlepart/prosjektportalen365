import { MessageBarType } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import { createReducer, current } from '@reduxjs/toolkit'
import * as strings from 'PortfolioWebPartsStrings'
import sortArray from 'array-sort'
import _ from 'lodash'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { parseUrlHash, setUrlHash } from 'pp365-shared-library/lib/util'
import { getObjectValue as get } from 'pp365-shared-library/lib/util/getObjectValue'
import {
  IPortfolioAggregationHashState,
  IPortfolioAggregationProps,
  IPortfolioAggregationState,
  PortfolioAggregationErrorMessage
} from '../types'
import {
  COLUMN_DELETED,
  COLUMN_FORM_PANEL_ON_SAVED,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  EXECUTE_SEARCH,
  GET_FILTERS,
  ON_FILTER_CHANGE,
  SELECTION_CHANGED,
  SET_ALL_COLLAPSED,
  SET_COLLAPSED,
  SET_CURRENT_VIEW,
  SET_DATA_SOURCE,
  SET_GROUP_BY,
  SET_SORT,
  SET_VIEW_FORM_PANEL,
  START_FETCH,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL,
  TOGGLE_FILTER_PANEL
} from './actions'
import { persistSelectedColumnsInWebPartProperties } from './persistSelectedColumnsInWebPartProperties'

/**
 * Create reducer for `<PortfolioAggregation />` using `createReducer` from `@reduxjs/toolkit`.
 *
 * @param props Props for `<PortfolioAggregation />` component
 * @param initialState Initial state for reducer
 */
export const createPortfolioAggregationReducer = (
  props: IPortfolioAggregationProps,
  initialState: IPortfolioAggregationState
) =>
  createReducer(initialState, {
    [DATA_FETCHED.type]: (state, { payload }: ReturnType<typeof DATA_FETCHED>) => {
      if (payload.items) {
        let items = props.postTransform ? props.postTransform(payload.items) : payload.items
        items = sortArray([...items], [state.sortBy?.fieldName ?? 'SiteTitle'], {
          reverse: state.sortBy?.isSortedDescending ? state.sortBy.isSortedDescending : false
        })

        if (payload.projects) {
          items = items.filter((item) =>
            _.some(payload.projects, ({ GtSiteId }) => GtSiteId === item.SiteId)
          )
        }

        state.items = items
      }

      if (payload.dataSources) state.views = payload.dataSources

      if (!payload.columns) {
        state.allColumnsForCategory = []
        state.columns = []
        return
      }

      let selectedColumns = !_.isEmpty(props.columns)
        ? props.columns
        : payload.dataSource.columns ?? []

      let allColumnsForCategory = payload.columns.map((c) =>
        c.setData({
          isSelected: _.some(selectedColumns, ({ key }) => key === c.key) || c.data.isLocked
        })
      )

      if (payload.dataSource.level.includes('Prosjekt'))
        allColumnsForCategory = allColumnsForCategory.filter((c) => c.internalName !== 'SiteTitle')

      selectedColumns = selectedColumns
        .map((c) => {
          const col = _.find(allColumnsForCategory, ({ key }) => key === c.key)
          return col ? col.merge(c) : null
        })
        .filter(Boolean)

      const availableColumns = payload.columns.filter(
        (c) => !_.some(selectedColumns, ({ key }) => key === c.key)
      )

      state.columns = !_.isEmpty(selectedColumns)
        ? [...selectedColumns, ...availableColumns]
        : sortArray(allColumnsForCategory, 'sortOrder')

      state.allColumnsForCategory = allColumnsForCategory
      state.loading = false
      state.error = null
      state.isChangingView = false
    },
    [TOGGLE_COLUMN_FORM_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_COLUMN_FORM_PANEL>
    ) => {
      state.columnForm = payload
    },
    [TOGGLE_EDIT_VIEW_COLUMNS_PANEL.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_EDIT_VIEW_COLUMNS_PANEL>
    ) => {
      state.isEditViewColumnsPanelOpen = payload.isOpen

      if (payload.columns) {
        state.columns = payload.columns
        persistSelectedColumnsInWebPartProperties(props, current(state).columns)
      }
    },
    [TOGGLE_FILTER_PANEL.type]: (state) => {
      state.isFilterPanelOpen = !state.isFilterPanelOpen
    },
    [TOGGLE_COMPACT.type]: (state) => {
      state.isCompact = !state.isCompact
    },
    [COLUMN_FORM_PANEL_ON_SAVED.type]: (state, { payload }) => {
      const column = payload.column.setData({ isSelected: true })

      if (payload.isNew) {
        state.columns = [...state.columns, payload.column]
        state.allColumnsForCategory = [...state.allColumnsForCategory, column]
      } else {
        state.columns = state.columns.map((col) =>
          col.fieldName === payload.column.fieldName ? payload.column : col
        )
        state.allColumnsForCategory = state.allColumnsForCategory.map((col) =>
          col.fieldName === column.fieldName ? column : col
        )
      }
      state.columnForm = { isOpen: false }
      state.columnAddedOrUpdated = new Date().getTime()
      persistSelectedColumnsInWebPartProperties(props, current(state).columns)
    },
    [COLUMN_DELETED.type]: (state, { payload }) => {
      state.columns = state.columns.filter((col) => col.id !== payload.columnId)
      state.columnForm = { isOpen: false }
      state.columnDeleted = new Date().getTime()
      persistSelectedColumnsInWebPartProperties(props, current(state).columns)
    },
    [TOGGLE_COLUMN_CONTEXT_MENU.type]: (
      state,
      { payload }: ReturnType<typeof TOGGLE_COLUMN_CONTEXT_MENU>
    ) => {
      state.columnContextMenu = payload
        ? {
            column: payload.column,
            target: payload.target as any
          }
        : null
    },
    [SET_ALL_COLLAPSED.type]: (state, { payload }: ReturnType<typeof SET_ALL_COLLAPSED>) => {
      state.groups = state.groups.map((g) => {
        return { ...g, isCollapsed: payload.isAllCollapsed }
      })
    },
    [SET_COLLAPSED.type]: (state, { payload }: ReturnType<typeof SET_COLLAPSED>) => {
      const { key, isCollapsed } = payload.group
      state.groups = state.groups.map((g) => {
        if (g.key === key) return { ...g, isCollapsed: !isCollapsed }
        return g
      })
    },
    [SET_GROUP_BY.type]: (state, { payload }: ReturnType<typeof SET_GROUP_BY>) => {
      const { column } = payload
      if (column && column.fieldName !== state.groupBy?.fieldName) {
        state.items = sortArray([...state.items], [column.fieldName])
        state.groupBy = column
        const groupNames: string[] = state.items.map((g) =>
          get<string>(g, state.groupBy.fieldName, strings.NotSet)
        )
        const uniqueGroupNames: string[] = _.uniq(groupNames)
        state.groups = uniqueGroupNames
          .sort((a, b) => (a > b ? 1 : -1))
          .map((name, idx) => {
            const count = groupNames.filter((n) => n === name).length
            const group = {
              key: `Group_${idx}`,
              name: `${state.groupBy.name}: ${name}`,
              startIndex: groupNames.indexOf(name, 0),
              count,
              isShowingAll: count === state.items.length,
              isDropEnabled: false,
              isCollapsed: false
            }
            return group
          })
      } else {
        state.groups = null
        state.groupBy = null
        state.items = state.items = sortArray(
          [...state.items],
          [state.sortBy?.fieldName ? state.sortBy.fieldName : 'SiteTitle'],
          {
            reverse: state.sortBy?.isSortedDescending ? state.sortBy.isSortedDescending : false
          }
        )
      }
    },
    [SET_SORT.type]: (state, { payload }: ReturnType<typeof SET_SORT>) => {
      const isSortedDescending = Object.keys(payload).includes('isSortedDescending')
        ? payload.isSortedDescending
        : !payload.column.isSortedDescending
      state.sortBy = payload.column
      if (state.groupBy) {
        state.groupBy = null
        state.groups = null
      }
      state.items = sortArray([...state.items], [payload.column.fieldName], {
        reverse: !isSortedDescending
      })
      state.columns = [...state.columns].map((col) => {
        col.isSorted = col.key === payload.column.key
        col.isSortedDescending = col.isSorted ? isSortedDescending : false
        return col
      })
    },
    [SET_CURRENT_VIEW.type]: (state) => {
      const hashState = parseUrlHash()
      const viewIdUrlParam = new URLSearchParams(document.location.href).get('viewId')
      let currentView: DataSource = null

      if (viewIdUrlParam) {
        currentView = _.find(state.views, (v) => v.id.toString() === viewIdUrlParam)
      } else if (hashState.has('viewId')) {
        currentView = _.find(state.views, (v) => v.id === hashState.get('viewId'))
      } else if (props.dataSource || props.defaultViewId) {
        currentView = _.find(
          state.views,
          (v) => v.title === props.dataSource || v.id.toString() === props.defaultViewId?.toString()
        )
      } else {
        currentView = _.find(state.views, (v) => v.isDefault)
      }
      if (!currentView && state.views.length > 0) {
        currentView = _.first(state.views)
      }
      if (!currentView) {
        state.error = new PortfolioAggregationErrorMessage(
          strings.ViewNotFoundMessage,
          MessageBarType.error
        )
        return
      }
      const obj: IPortfolioAggregationHashState = {}
      if (currentView) obj.viewId = currentView.id.toString()
      if (state.groupBy) obj.groupBy = state.groupBy.fieldName
      setUrlHash(obj)
      state.currentView = currentView
      state.activeFilters = {}
    },
    [SET_DATA_SOURCE.type]: (state, { payload }: ReturnType<typeof SET_DATA_SOURCE>) => {
      state.isChangingView = !!payload
      const obj: IPortfolioAggregationHashState = {}
      if (state.currentView) obj.viewId = payload.dataSource.id.toString()
      if (state.groupBy) obj.groupBy = state.groupBy.fieldName
      setUrlHash(obj)
      state.currentView = payload.dataSource
      state.activeFilters = {}
    },
    [START_FETCH.type]: (state) => {
      state.loading = true
      state.isChangingView = true
    },
    [EXECUTE_SEARCH.type]: (state, { payload }: ReturnType<typeof EXECUTE_SEARCH>) => {
      state.searchTerm = payload
    },
    [GET_FILTERS.type]: (state, { payload }: ReturnType<typeof GET_FILTERS>) => {
      const payloadFilters = payload.filters.map((column) => {
        const uniqueValues = _.uniq(
          // eslint-disable-next-line prefer-spread
          [].concat.apply(
            [],
            state.items.map((i) => get(i, column.fieldName, '').split(';'))
          )
        )

        let items: IFilterItemProps[] = uniqueValues
          .filter((value: string) => !stringIsNullOrEmpty(value))
          .map((value: string) => ({ name: value, value, selected: false }))
        items = items.sort((a, b) => (a.value > b.value ? 1 : -1))
        return { column, items }
      })

      if (!_.isEmpty(state.activeFilters)) {
        const filteredFields = Object.keys(state.activeFilters)
        filteredFields.forEach((key) => {
          payloadFilters.forEach((filter) => {
            if (filter.column.fieldName === key) {
              state.activeFilters[key].forEach((value) => {
                filter.items.forEach((item) => {
                  if (value === item.name) {
                    item.selected = true
                  }
                })
              })
            }
          })
        })
      }

      state.filters = payloadFilters
    },
    [ON_FILTER_CHANGE.type]: (state, { payload }: ReturnType<typeof ON_FILTER_CHANGE>) => {
      if (payload.selectedItems.length > 0) {
        state.activeFilters = {
          ...state.activeFilters,
          [payload.column.fieldName]: payload.selectedItems.map((i) => i.value)
        }
      } else {
        state.activeFilters = _.omit(state.activeFilters, payload.column.fieldName)
      }
      state.filters = state.filters.map((f) => {
        if (payload.column.key === f.column.key) {
          f.items = f.items.map((i) => {
            const isSelected =
              _.filter(payload.selectedItems, (_i) => _i.value === i.value).length > 0
            return {
              ...i,
              selected: isSelected
            }
          })
        }
        return f
      })
    },
    [DATA_FETCH_ERROR.type]: (state, { payload }: ReturnType<typeof DATA_FETCH_ERROR>) => {
      state.error = payload.error
    },
    [SET_VIEW_FORM_PANEL.type]: (state, { payload }: ReturnType<typeof SET_VIEW_FORM_PANEL>) => {
      switch (payload.submitAction) {
        case 'add':
          {
            state.currentView = payload.view
            state.views = [...state.views, payload.view]
            state.viewForm = { isOpen: false }
          }
          break
        case 'edit':
          {
            state.currentView = payload.view
            state.views = state.views.map((v) => {
              if (v.id === payload.view.id) {
                return payload.view
              }
              return v
            })
            state.viewForm = { isOpen: false }
          }
          break
        default: {
          state.viewForm = _.omit(payload, 'submitAction')
        }
      }
    },
    [SELECTION_CHANGED.type]: (state, { payload }: ReturnType<typeof SELECTION_CHANGED>) => {
      state.selectedItems = payload.getSelection()
    }
  })
