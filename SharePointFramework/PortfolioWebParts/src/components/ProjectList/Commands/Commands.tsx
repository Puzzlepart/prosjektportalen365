import { SearchBox } from '@fluentui/react-components'
import _ from 'lodash'
import { Toolbar } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ProjectListContext } from '../context'
import styles from './Commands.module.scss'
import { useCommands } from './useCommands'

export const Commands: FC = () => {
  const context = useContext(ProjectListContext)
  const { toolbarItems, searchBoxPlaceholder } = useCommands()
  return (
    <div className={styles.commands}>
      <div className={styles.search} hidden={!context.props.showSearchBox}>
        <SearchBox
          className={styles.searchBox}
          disabled={!context.state.isDataLoaded || _.isEmpty(context.state.projects)}
          value={context.state.searchTerm}
          placeholder={searchBoxPlaceholder}
          aria-label={searchBoxPlaceholder}
          title={searchBoxPlaceholder}
          size='large'
          onChange={(_, { value }) => context.setState({ searchTerm: value })}
          contentAfter={{
            onClick: () => context.setState({ searchTerm: '' })
          }}
          appearance='filled-lighter'
        />
      </div>
      <Toolbar items={toolbarItems} />
    </div>
  )
}
