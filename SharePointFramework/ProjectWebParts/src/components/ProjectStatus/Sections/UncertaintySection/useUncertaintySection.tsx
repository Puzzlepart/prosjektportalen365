import { IColumn } from '@fluentui/react'
import _ from 'lodash'
import { getObjectValue as get, calculateValues } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { UncertaintyElementModel } from '../../../../models'
import { useProjectStatusContext } from '../../context'
import { PERSIST_SECTION_DATA } from '../../reducer'
import { useFetchListData } from '../ListSection/useFetchListData'
import { SectionContext } from '../context'
import { IUncertaintySectionData, IUncertaintySectionState } from './types'
import { ISummation } from '../ListSection'

/**
 * Component logic hook for `UncertaintySection`. Fetches list data
 * from SharePoint, handles state and dispatches actions to the reducer,
 * as well as handling the logic for rendering the section content using
 * the `shouldRenderContent` flag.
 */
export function useUncertaintySection() {
  const context = useProjectStatusContext()
  const { selectedReport } = context.state
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IUncertaintySectionState>({ isDataLoaded: false, data: {} })
  const fetchListData = useFetchListData()
  const shouldRenderContent = !_.isEmpty(state.data?.items)

  useEffect(() => {
    const persistedData = selectedReport.persistedSectionData
    if (persistedData) {
      const persistedSectionData = selectedReport.persistedSectionData[section.id]
      setState({ data: persistedSectionData, isDataLoaded: true })
    } else {
      fetchListData().then((_data) => {
        const contentTypeIndex = parseInt(
          _.first(_data?.items)?.ContentType?.Id?.StringValue?.substring(38, 40) ?? '-1'
        )

        const data: IUncertaintySectionData = {
          ..._data,
          matrixElements: _data?.items?.map((i) => new UncertaintyElementModel(i)),
          contentTypeIndex,
          summation: calculateValues(section?.sumField, _data?.items)
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
  }, [context.state.selectedReport])

  return {
    state,
    matrixElements: get<any[]>(state, 'data.matrixElements', []),
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    summation: get<ISummation>(state, 'data.summation', {}),
    shouldRenderContent
  } as const
}
