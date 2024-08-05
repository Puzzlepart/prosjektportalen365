import { SearchBox } from '@fluentui/react-components'
import _ from 'lodash'
import { Toolbar } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import styles from './Commands.module.scss'
import { useCommands } from './useCommands'
import { ProjectProvisionContext } from 'components/ProjectProvision/context'
import strings from 'PortfolioWebPartsStrings'

export const Commands: FC = () => {
  const context = useContext(ProjectProvisionContext)
  const { toolbarItems } = useCommands()
  return (
    <div className={styles.commands}>
      <div className={styles.search}>
        <SearchBox
          className={styles.searchBox}
          disabled={context.state.loading || _.isEmpty(context.state.requests)}
          value={context.state.searchTerm}
          placeholder={strings.Provision.StatusSearchLabel}
          aria-label={strings.Provision.StatusSearchLabel}
          title={strings.Provision.StatusSearchLabel}
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
