import { MessageBarType, Pivot, PivotItem } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './ProjectProperties.module.scss'
import { ProjectProperty } from './ProjectProperty'
import { IProjectPropertiesProps } from './types'

export const ProjectProperties: FC<IProjectPropertiesProps> = ({ displayAllProperties }) => {
  const context = useProjectInformationContext()
  const properties =
    (displayAllProperties ? context.state.allProperties : context.state.properties) ?? []
  const nonEmptyProperties = properties.filter((p) => !p.isEmpty)

  switch (context.props.displayMode) {
    case DisplayMode.Edit: {
      return (
        <div className={styles.projectProperties}>
          <Pivot>
            <PivotItem headerText={context.props.title}>
              <div className={styles.pivotItem}>
                {nonEmptyProperties.map((model, idx) => (
                  <ProjectProperty key={idx} model={model} />
                ))}
              </div>
            </PivotItem>
            {context.props.isSiteAdmin && (
              <PivotItem headerText={strings.ExternalUsersConfigText} itemIcon='FilterSettings'>
                <div className={styles.pivotItem}>
                  <UserMessage
                    className={styles.pivotItemUserMessage}
                    text={strings.ExternalUsersConfigInfoText}
                  />
                  <UserMessage
                    hidden={!stringIsNullOrEmpty(context.state.data.propertiesListId)}
                    className={styles.pivotItemUserMessage}
                    text={strings.NoLocalPropertiesListWarningText}
                    type={MessageBarType.warning}
                  />
                  <div hidden={stringIsNullOrEmpty(context.state.data.propertiesListId)}>
                    {context.state.properties.map((model, idx) => (
                      <ProjectProperty key={idx} model={model} />
                    ))}
                  </div>
                </div>
              </PivotItem>
            )}
          </Pivot>
        </div>
      )
    }
    case DisplayMode.Read: {
      if (isEmpty(nonEmptyProperties)) {
        return <UserMessage text={strings.NoPropertiesMessage} />
      }
      return (
        <div className={styles.projectProperties}>
          {nonEmptyProperties.map((model, idx) => (
            <ProjectProperty key={idx} model={model} />
          ))}
        </div>
      )
    }
  }
}
