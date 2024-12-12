import { SearchBox } from '@fluentui/react-components'
import _ from 'lodash'
import { Toolbar } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './Commands.module.scss'
import { useCommands } from './useCommands'
import { useIdeaModuleContext } from 'components/IdeaModule/context'

export const Commands: FC = () => {
  const context = useIdeaModuleContext()
  const { toolbarItems, searchBoxPlaceholder } = useCommands()
  return (
    <div className={styles.commands}>
      <div className={styles.search} hidden={!context.props.showSearchBox}>
        <SearchBox
          className={styles.searchBox}
          disabled={!context.state.loading || _.isEmpty(context.state.ideas)}
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
