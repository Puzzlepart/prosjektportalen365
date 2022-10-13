import { stringIsNullOrEmpty } from '@pnp/common'
import React, { useContext } from 'react'
import { ProgramAggregationContext } from '../context'
import { SEARCH } from '../reducer'
import styles from './SearchBox.module.scss'
import strings from 'ProgramWebPartsStrings'
import { format, SearchBox } from '@fluentui/react'

export default () => {
  const { props, state, dispatch } = useContext(ProgramAggregationContext)

  /**
   * Get placeholder text
   */
  function getPlaceholderText(): string {
    if (!stringIsNullOrEmpty(props.searchBoxPlaceholderText)) {
      return props.searchBoxPlaceholderText
    }
    if (state.dataSource) {
      return format(strings.SearchBoxPlaceholderText, state.dataSource.toLowerCase())
    }
    return ''
  }

  return (
    <div className={styles.root} hidden={!props.showSearchBox}>
      <SearchBox
        placeholder={getPlaceholderText()}
        onChange={(_, searchTerm) => dispatch(SEARCH({ searchTerm }))}
      />
    </div>
  )
}
