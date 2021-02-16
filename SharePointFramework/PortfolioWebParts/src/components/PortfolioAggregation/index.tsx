import { DetailsList } from 'office-ui-fabric-react/lib/DetailsList'
import React, { useEffect, useState } from 'react'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

export const PortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const [state, setState] = useState<IPortfolioAggregationState>({
    loading: true,
    items: [],
    columns: [{
      key: 'Title',
      fieldName: 'Title',
      name: 'Tittel',
      minWidth: 150
    }]
  })

  useEffect(() => {
    props.dataAdapter.fetchItemsWithSource(props.dataSource, ['Title'])
      .then(items => {
        // eslint-disable-next-line no-console
        console.log(items)
        setState({ ...state, items })
      })
  }, [])

  return (
    <div>
      <DetailsList
        items={state.items}
        columns={state.columns} />
    </div>
  )
}

export * from './types'
