import { DisplayMode } from '@microsoft/sp-core-library'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot'
import * as strings from 'ProjectWebPartsStrings'
import React, { FunctionComponent } from 'react'
import { isEmpty } from 'underscore'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import styles from './ProjectProperties.module.scss'
import { ProjectProperty } from './ProjectProperty'
import { IProjectPropertiesProps } from './types'

export const ProjectProperties: FunctionComponent<IProjectPropertiesProps> = (
  props: IProjectPropertiesProps
) => {
  const nonEmptyProperties = props.properties.filter(({ empty }) => !empty)

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
                  hidden={props.propertiesList}
                  className={styles.pivotItemUserMessage}
                  text={strings.NoLocalPropertiesListWarningText}
                  type={MessageBarType.warning}
                />
                <div hidden={!props.propertiesList}>
                  {props.properties.map((model, idx) => (
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
