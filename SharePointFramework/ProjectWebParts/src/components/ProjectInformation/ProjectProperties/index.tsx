import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/common'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'
import { isEmpty } from 'underscore'
import { ProjectInformationContext } from '../context'
import styles from './ProjectProperties.module.scss'
import { ProjectProperty } from './ProjectProperty'
import { IProjectPropertiesProps } from './types'

export const ProjectProperties: FunctionComponent<IProjectPropertiesProps> = ({ properties }) => {
  const { props, state } = useContext(ProjectInformationContext)
  const nonEmptyProperties = properties.filter(({ empty }) => !empty)

  if (props.displayMode !== DisplayMode.Edit) {
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
          <PivotItem headerText={props.title}>
            <div className={styles.pivotItem}>
              {nonEmptyProperties.map((model, idx) => (
                <ProjectProperty key={idx} model={model} />
              ))}
            </div>
          </PivotItem>
          {props.isSiteAdmin && (
            <PivotItem headerText={strings.ExternalUsersConfigText} itemIcon='FilterSettings'>
              <div className={styles.pivotItem}>
                <UserMessage
                  className={styles.pivotItemUserMessage}
                  text={strings.ExternalUsersConfigInfoText}
                />
                <UserMessage
                  hidden={!stringIsNullOrEmpty(state.data.propertiesListId)}
                  className={styles.pivotItemUserMessage}
                  text={strings.NoLocalPropertiesListWarningText}
                  type={MessageBarType.warning}
                />
                <div hidden={stringIsNullOrEmpty(state.data.propertiesListId)}>
                  {properties.map((model, idx) => (
                    <ProjectProperty
                      key={idx}
                      model={model}
                      displayMode={DisplayMode.Edit}
                      onFieldExternalChanged={props.onFieldExternalChanged}
                      showFieldExternal={props.showFieldExternal}
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
