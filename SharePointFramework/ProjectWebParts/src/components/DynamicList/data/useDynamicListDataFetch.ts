import { useEffect, useState } from 'react'
import { IDynamicListProps, IDynamicListState, IDynamicListData } from '../types'
import { fetchListData } from './fetchListData'

export function useDynamicListDataFetch(
  props: IDynamicListProps,
  state: IDynamicListState,
  setState: (newState: Partial<IDynamicListState>) => void
): IDynamicListData {
  const [data, setData] = useState<IDynamicListData>({
    listItems: [],
    listColumns: []
  })

  useEffect(() => {
    if (!props.listName) {
      setData({ listItems: [], listColumns: [] })
      setState({ isLoading: false })
      return
    }

    setState({ isLoading: true })
    fetchListData(props)
      .then((fetchedData) => {
        setData(fetchedData)
        setState({ data: fetchedData, isLoading: false })
      })
      .catch((error) => {
        console.error('[DynamicList] Error fetching data:', error)
        setState({ error: error.message, isLoading: false })
      })
  }, [props.listName, props.pageContext?.web?.absoluteUrl, state.refetch])

  return data
}
