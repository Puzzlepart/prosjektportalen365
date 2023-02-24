import { IColumn } from '@fluentui/react'
import _ from 'lodash'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { useContext, useEffect, useState } from 'react'
import { UncertaintyElementModel } from '../../../../models'
import { isEmpty } from 'underscore'
import { ProjectStatusContext } from '../../context'
import { PERSIST_SECTION_DATA } from '../../reducer'
import { SectionContext } from '../context'
import { useFetchListData } from '../ListSection/useFetchListData'
import { IUncertaintySectionData, IUncertaintySectionState } from './types'

/**
 * Component logic hook for `UncertaintySection`. Fetches list data
 * from SharePoint, handles state and dispatches actions to the reducer,
 * aswell as handling the logic for rendering the section content using
 * the `shouldRenderContent` flag.
 */
export function useUncertaintySection() {
  const context = useContext(ProjectStatusContext)
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IUncertaintySectionState>({ isDataLoaded: false, data: {} })
  const fetchListData = useFetchListData()
  const shouldRenderContent =
    (context.state.data.reports
      ? context.state.selectedReport.id === context.state.mostRecentReportId
      : true) && !isEmpty(state.data?.items)

  useEffect(() => {
    const persistedData = context.state.selectedReport.persistedSectionData[section.id]
    if (persistedData) {
      setState({ data: persistedData, isDataLoaded: true })
    } else {
      fetchListData().then((_data) => {
        const contentTypeIndex = parseInt(
          _.first(_data?.items)?.ContentType?.Id?.StringValue?.substring(38, 40) ?? '-1'
        )
        const data: IUncertaintySectionData = {
          ..._data,
          matrixElements: _data?.items?.map((i) => new UncertaintyElementModel(i)),
          contentTypeIndex
        }
        context.dispatch(
          PERSIST_SECTION_DATA({
            section,
            data
          })
        )
        setState({ data, isDataLoaded: true })
      })
    }
  }, [])

  return {
    state,
    matrixElements: get<any[]>(state, 'data.matrixElements', []),
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    shouldRenderContent
  } as const
}
