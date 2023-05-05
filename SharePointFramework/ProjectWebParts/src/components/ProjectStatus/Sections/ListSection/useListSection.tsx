import { IColumn } from '@fluentui/react'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { PERSIST_SECTION_DATA } from '../../reducer'
import { SectionContext } from '../context'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'

/**
 * Component logic hook for `ListSection`. Fetches list data
 * from SharePoint, handles state and dispatches actions to the reducer.
 */
export function useListSection() {
  const context = useContext(ProjectStatusContext)
  const { selectedReport } = context.state
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({
    isDataLoaded: false,
    data: {}
  })
  const fetchListData = useFetchListData()
  const shouldRenderList = !_.isEmpty(state.data?.items)

  useEffect(() => {
    const persistedData = selectedReport.persistedSectionData && selectedReport.persistedSectionData[section.id]
    if (persistedData) {
      setState({ data: persistedData, isDataLoaded: true })
    } else {
      fetchListData().then((data) => {
        context.dispatch(PERSIST_SECTION_DATA({ section, data }))
        setState({ data, isDataLoaded: true })
      })
    }
  }, [context.state.selectedReport])

  return {
    state,
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    shouldRenderList
  } as const
}
