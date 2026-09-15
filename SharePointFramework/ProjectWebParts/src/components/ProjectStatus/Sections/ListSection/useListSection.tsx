import { IColumn } from '@fluentui/react'
import _ from 'lodash'
import { getObjectValue as get, calculateValues } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { useProjectStatusContext } from '../../../ProjectStatus/context'
import { PERSIST_SECTION_DATA } from '../../reducer'
import { SectionContext } from '../context'
import { IListSectionData, IListSectionState, ISummation } from './types'
import { useFetchListData } from './useFetchListData'

/**
 * Component logic hook for `ListSection`. Fetches list data
 * from SharePoint, handles state and dispatches actions to the reducer.
 */
export function useListSection() {
  const context = useProjectStatusContext()
  const { selectedReport } = context.state
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({
    isDataLoaded: false,
    data: {}
  })
  const fetchListData = useFetchListData()
  const shouldRenderList = !_.isEmpty(state.data?.items)

  useEffect(() => {
    // Ignore completions from a previous report/scope: a stale request
    // resolving after a scope switch must not overwrite the reset section
    // cache with data from the wrong list.
    let cancelled = false
    const persistedData = selectedReport.persistedSectionData
    if (persistedData) {
      const persistedSectionData = selectedReport.persistedSectionData[section.id]
      setState({ data: persistedSectionData, isDataLoaded: true })
    } else {
      fetchListData()
        .then((_data) => {
          if (cancelled) return
          const data: IListSectionData = {
            ..._data,
            summation: _data ? calculateValues(section?.sumField, _data.items) : undefined
          }

          context.dispatch(PERSIST_SECTION_DATA({ section, data }))
          setState({ data, isDataLoaded: true })
        })
        .catch((error) => {
          if (cancelled) return
          setState({ error, isDataLoaded: true })
        })
    }
    return () => {
      cancelled = true
    }
  }, [context.state.selectedReport, context.state.selectedScope])

  return {
    state,
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    summation: get<ISummation>(state, 'data.summation', {}),
    shouldRenderList
  } as const
}
