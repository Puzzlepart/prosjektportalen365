import { format, SearchBox } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { SEARCH } from '../reducer'
import styles from './SearchBox.module.scss'

export default () => {
  const { props, state, dispatch } = useContext(PortfolioAggregationContext)

  /**
   * Get placeholder text
   */
  function getPlaceholderText(): string {
    if (!stringIsNullOrEmpty(props.searchBoxPlaceholderText)) {
      return props.searchBoxPlaceholderText
    }
    if (state.dataSource) {
      return format(
        strings.SearchBoxPlaceholderText,
        state.dataSource.toLowerCase()
      )
    }
    return ''
  }

  return (
    <div className={styles.root} hidden={!props.showSearchBox}>
      <SearchBox
        placeholder={getPlaceholderText()}
        onChange={(_event, searchTerm) => dispatch(SEARCH({ searchTerm }))}
      />
    </div>
  )
}
