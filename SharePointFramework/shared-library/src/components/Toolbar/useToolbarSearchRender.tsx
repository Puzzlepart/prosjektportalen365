import { SearchBox } from '@fluentui/react-components'
import React from 'react'
import { ListMenuItem } from './types'
import styles from './Toolbar.module.scss'
import { getSearchBoxDismissProps } from '../../util'

/**
 * Renders a command's search box with localized dismissal controls.
 */
export function useToolbarSearchRender() {
  /**
   * Renders a command's search box, returning nothing when none is configured.
   */
  function renderToolbarSearch(item: ListMenuItem) {
    if (!item.searchBox) return null

    return (
      <div className={styles.search} hidden={item.hidden}>
        <SearchBox
          dismiss={getSearchBoxDismissProps()}
          className={styles.searchBox}
          style={{ ...item.style }}
          disabled={item.disabled}
          placeholder={item.searchBox.placeholder}
          aria-label={item.searchBox['aria-label']}
          title={item.searchBox.title}
          value={item.searchBox.value}
          onChange={item.searchBox.onChange}
          contentAfter={item.searchBox.contentAfter}
          size='large'
          appearance='filled-lighter'
        />
      </div>
    )
  }

  return { renderToolbarSearch }
}
