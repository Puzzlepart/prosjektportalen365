import { SearchBox } from '@fluentui/react-components'
import React from 'react'
import { ListMenuItem } from './types'
import styles from './Toolbar.module.scss'

export function useToolbarSearchRender() {
  /**
   * Renders a search box in the toolbar.
   *
   * @param item The list menu item containing search configuration.
   *
   * @returns The rendered search box component.
   */
  function renderToolbarSearch(item: ListMenuItem) {
    if (!item.searchBox) return null

    return (
      <div className={styles.search} hidden={item.hidden}>
        <SearchBox
          className={styles.searchBox}
          style={{ minWidth: '250px', width: '320px', ...item.style }}
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
