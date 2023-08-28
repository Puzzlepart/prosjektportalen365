import { MessageBarType } from '@fluentui/react'
import { Tab, TabList } from '@fluentui/react-components'
import { Filter24Filled, Filter24Regular, bundleIcon } from '@fluentui/react-icons'
import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC, useState } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './ProjectProperties.module.scss'
import { ProjectProperty } from './ProjectProperty'
import { IProjectPropertiesProps } from './types'
import { useProjectProperties } from './useProjectProperties'
const FilterIcon = bundleIcon(Filter24Filled, Filter24Regular)

export const ProjectProperties: FC<IProjectPropertiesProps> = (props) => {
  const context = useProjectInformationContext()
  const [selectedTab, setSelectedTab] = useState('view')
  const properties = useProjectProperties(props)

  switch (context.props.displayMode) {
    case DisplayMode.Edit: {
      return (
        <div className={styles.root}>
          <TabList onTabSelect={(_, data) => setSelectedTab(data.value as any)}>
            <Tab value='view'>{context.props.title}</Tab>
            {context.props.isSiteAdmin && (
              <Tab value='config' icon={<FilterIcon />}>
                {strings.ExternalUsersConfigText}
              </Tab>
            )}
          </TabList>
          <div className={styles.tabContainer}>
            {selectedTab === 'view' && (
              <>
                {properties.map((model, idx) => (
                  <ProjectProperty key={idx} model={model} displayMode={DisplayMode.Read} />
                ))}
              </>
            )}
            {selectedTab === 'config' && (
              <>
                <UserMessage
                  className={styles.userMessage}
                  text={strings.ExternalUsersConfigInfoText}
                />
                <UserMessage
                  hidden={!stringIsNullOrEmpty(context.state.data.propertiesListId)}
                  className={styles.userMessage}
                  text={strings.NoLocalPropertiesListWarningText}
                  type={MessageBarType.warning}
                />
                <div hidden={stringIsNullOrEmpty(context.state.data.propertiesListId)}>
                  {context.state.properties.map((model, idx) => (
                    <ProjectProperty key={idx} model={model} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )
    }
    default: {
      if (isEmpty(properties)) {
        return <UserMessage text={strings.NoPropertiesMessage} />
      }
      return (
        <div className={styles.root}>
          {properties.map((model, idx) => (
            <ProjectProperty key={idx} model={model} />
          ))}
        </div>
      )
    }
  }
}
