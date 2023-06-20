import { Pivot, PivotItem, MessageBarType } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/common'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { isEmpty } from 'underscore'
import { ProjectInformationContext } from '../context'
import styles from './ProjectProperties.module.scss'
import { ProjectProperty } from './ProjectProperty'
import { IProjectPropertiesProps } from './types'

export const ProjectProperties: FC<IProjectPropertiesProps> = (props) => {
  const context = useContext(ProjectInformationContext)
  const nonEmptyProperties = props.properties?.filter(({ empty }) => !empty) ?? []

  if (context.props.displayMode !== DisplayMode.Edit) {
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
  } else {
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
                  {props.properties.map((model, idx) => (
                    <ProjectProperty
                      key={idx}
                      model={model}
                      displayMode={DisplayMode.Edit}
                      onFieldExternalChanged={context.props.onFieldExternalChanged}
                      showFieldExternal={context.props.showFieldExternal}
                    />
                  ))}
                </div>
              </div>
            </PivotItem>
          )}
        </Pivot>
      </div>
    )
  }
}

ProjectProperties.defaultProps = {
  properties: []
}
