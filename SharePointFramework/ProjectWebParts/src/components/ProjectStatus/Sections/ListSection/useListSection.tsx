import { IColumn } from '@fluentui/react'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { useContext, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { PERSIST_SECTION_DATA } from '../../reducer'
import { SectionContext } from '../context'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'

/**
 * Component logic hook for `ListSection`
 */
export function useListSection() {
  const context = useContext(ProjectStatusContext)
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({
    isDataLoaded: false,
    data: {}
  })
  const fetchListData = useFetchListData()
  const shouldRenderList =
    (context.state.data.reports
      ? context.state.selectedReport.id === context.state.mostRecentReportId
      : true) && !isEmpty(state.data?.items)

  useEffect(() => {
    const persistedData = context.state.selectedReport.persistedSectionData[section.id]
    if (persistedData) {
      setState({ data: persistedData, isDataLoaded: true })
    } else {
      fetchListData().then((data) => {
        context.dispatch(PERSIST_SECTION_DATA({ section, data }))
        setState({ data, isDataLoaded: true })
      })
    }
  }, [])

  return {
    state,
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    shouldRenderList
  } as const
}
