import { format, MessageBarType } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import { createReducer, current } from '@reduxjs/toolkit'
import * as strings from 'PortfolioWebPartsStrings'
import sortArray from 'array-sort'
import _ from 'lodash'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import {
  isTaxonomyManagedProperty,
  parseTaxonomyValue,
  parseUrlHash,
  setUrlHash,
  sortAlphabetically,
  sortNumerically
} from 'pp365-shared-library/lib/util'
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
import resource from 'SharedResources'
import { ProjectContentColumn } from 'pp365-shared-library/lib/models/ProjectContentColumn'

/**
 * Parses a raw SharePoint field value into a display-friendly string.
 * Handles user fields (pipe-separated), lookup fields (`;#`-separated),
 * calculated/number fields (e.g. `#10.0000000000000` or `2.00000000000000`),
 * and returns the value as-is for other types.
 *
 * @param value Raw field value
 */
function parseDisplayValue(value: string): string {
  if (!value) return value
  if (value.includes(' | ')) {
    const match = value.match(/\|([^|]+)\|/)
    if (match) return match[1].trim()
    return value.split(' | ')[1]?.trim() || value
  }
  if (value.includes('L0|#')) {
    return parseTaxonomyValue(value)
  }
  if (value.includes(';#')) {
    const tail = value.split(';#')[1] || value
    return tail.includes('|') ? tail.split('|')[0] : tail
  }
  const numericMatch = value.match(/^#?(-?\d+(?:\.\d+)?)$/)
  if (numericMatch) {
    const num = parseFloat(numericMatch[1])
    if (!isNaN(num))
      return Number.isInteger(num) ? num.toString() : parseFloat(num.toFixed(2)).toString()
  }
  return value
}

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

      const configView = _.find(
        props.configuration?.views ?? [],
        (v) => v.id === payload.dataSource?.id
      )
      const availableColumns = props.configuration?.columns ?? payload.columns

      console.log(availableColumns)
      const columnIds = configView?.columnIds ?? payload.dataSource?.columnIds ?? []
      console.log(columnIds)
      const viewColumns = (configView?.columns ?? payload.dataSource?.columns ?? [])
        .slice()
        .sort((a, b) => {
          const indexA = columnIds.indexOf(a.id)
          const indexB = columnIds.indexOf(b.id)
          return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
        })

      let selectedColumns = !_.isEmpty(viewColumns) ? viewColumns : (props.columns ?? [])

      let allColumnsForCategory = availableColumns.map((c) => {

        const col = c instanceof ProjectContentColumn ? c : Object.assign(new ProjectContentColumn(), c)
        const column = col.setData({
          isSelected: _.some(selectedColumns, ({ key }) => key === col.key) || col.data?.isLocked
        })
        if (
          column.fieldName &&
          isTaxonomyManagedProperty(column.fieldName) &&
          (!column.dataType || column.dataType === 'text')
        ) {
          column.setData({ renderAs: 'tags' })
        }
        return column
      })

      if (payload.dataSource.level.includes(resource.Lists_DataSources_Level_Project)) {
        allColumnsForCategory = allColumnsForCategory.filter(
          ({ internalName }) => internalName !== 'SiteTitle'
        )
      }

      console.log('acf', allColumnsForCategory)

      selectedColumns = selectedColumns
        .map((c) => {
          const col = _.find(allColumnsForCategory, ({ key }) => key === c.key)
          return col ? col.merge(c) : null
        })
        .filter(Boolean)

      state.columns = !_.isEmpty(selectedColumns)
        ? selectedColumns
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

        const selectedColumnKeys = new Set(payload.columns.map((c) => c.key))
        state.allColumnsForCategory = current(state).allColumnsForCategory.map((c) => {
          const col = Object.assign(new ProjectContentColumn(), c)
          col.setData({ isSelected: selectedColumnKeys.has(col.key) || c.data?.isLocked })
          return col
        })

        if (state.currentView) {
          state.currentView.columns = payload.columns
          state.currentView.columnIds = payload.columns.map((c) => c.id)
          const viewIndex = state.views.findIndex((v) => v.id === state.currentView.id)
          if (viewIndex !== -1) {
            state.views[viewIndex].columns = payload.columns
            state.views[viewIndex].columnIds = payload.columns.map((c) => c.id)
          }
        }
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
              name: `${state.groupBy.name}: ${parseDisplayValue(name)}`,
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
      switch (payload.column.dataType) {
        case 'currency':
          state.items = state.items.sort((a, b) =>
            sortNumerically(a, b, isSortedDescending, payload.column.fieldName, 'kr ')
          )
          break
        case 'number':
          state.items = state.items.sort((a, b) =>
            sortNumerically(a, b, isSortedDescending, payload.column.fieldName)
          )
          break
        case 'percentage':
          state.items = state.items.sort((a, b) =>
            sortNumerically(a, b, isSortedDescending, payload.column.fieldName, '%')
          )
          break
        default:
          state.items.sort((a, b) =>
            sortAlphabetically(a, b, isSortedDescending, payload.column.fieldName)
          )
          break
      }
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
      let errorMessage = strings.ViewNotFoundMessage || ''

      if (viewIdUrlParam) {
        currentView = _.find(state.views, (v) => v.id.toString() === viewIdUrlParam)
        if (!currentView) {
          errorMessage = format(strings.ViewNotFoundMessage_Id || '{0}', viewIdUrlParam || '')
        }
      } else if (hashState.has('viewId')) {
        currentView = _.find(state.views, (v) => v.id === hashState.get('viewId'))
        if (!currentView) {
          errorMessage = format(
            strings.ViewNotFoundMessage_Id || '{0}',
            hashState.get('viewId') || ''
          )
        }
      } else if (props.defaultViewId) {
        currentView = _.find(
          state.views,
          (v) => v.id.toString() === props.defaultViewId?.toString()
        )
      } else if (props.dataSource) {
        currentView = _.find(state.views, (v) => v.title === props.dataSource)
        if (!currentView) {
          errorMessage = format(
            strings.ViewNotFoundMessage_WebPartProperty || '{0}',
            props.dataSource || ''
          )
        }
      } else {
        currentView = _.find(state.views, (v) => v.isDefault)
      }
      if (!currentView && !_.isEmpty(state.views)) {
        currentView = _.first(state.views)
      }
      if (!currentView) {
        state.error = new PortfolioAggregationErrorMessage(errorMessage, MessageBarType.error)
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
      if (state.currentView?.id === payload.dataSource.id) {
        return
      }
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
    },
    [EXECUTE_SEARCH.type]: (state, { payload }: ReturnType<typeof EXECUTE_SEARCH>) => {
      state.searchTerm = payload
    },
    [GET_FILTERS.type]: (state, { payload }: ReturnType<typeof GET_FILTERS>) => {
      const payloadFilters = payload.filters.map(({ column, group, defaultCollapsed }) => {
        const collectFromProjectRefiners = (): string[] => {
          if (stringIsNullOrEmpty(column.internalName)) return []
          return _.flatten(
            state.items.map((i: any) => {
              const value = i.__projectRefinerValues?.[column.internalName]
              if (value === undefined || value === null) return []
              if (Array.isArray(value)) return value.map((v) => (v == null ? '' : String(v)))
              return String(value).split(';')
            })
          ).filter((v: string) => !stringIsNullOrEmpty(v))
        }
        const collectFromSearchItems = (): string[] =>
          _.flatten(state.items.map((i: any) => get(i, column.fieldName, '').split(';')))

        const refinerValues = collectFromProjectRefiners()
        const rawValues = refinerValues.length > 0 ? refinerValues : collectFromSearchItems()
        const uniqueValues = _.uniq(rawValues)

        const isBooleanField =
          column.fieldName?.includes('GtIsProgram') ||
          column.fieldName?.includes('GtIsParentProject')

        let items: IFilterItemProps[] = uniqueValues
          .filter((value: string) => !stringIsNullOrEmpty(value))
          .map((value: string) => {
            let name = parseDisplayValue(value)
            if (isBooleanField) {
              if (value === '1') name = strings.BooleanYes
              else if (value === '0') name = strings.BooleanNo
            }
            return { name, value, selected: false }
          })
        items = items.sort((a, b) => (a.value > b.value ? 1 : -1))
        return { column, items, group, defaultCollapsed }
      })

      if (!_.isEmpty(state.activeFilters)) {
        const filteredFields = Object.keys(state.activeFilters)
        filteredFields.forEach((key) => {
          payloadFilters.forEach((filter) => {
            if (filter.column.fieldName === key) {
              state.activeFilters[key].forEach((value) => {
                filter.items.forEach((item) => {
                  if (value === item.value) {
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
            const obj: IPortfolioAggregationHashState = {}
            if (state.currentView) obj.viewId = payload.view.id.toString()
            if (state.groupBy) obj.groupBy = state.groupBy.fieldName
            setUrlHash(obj)
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
