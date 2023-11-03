import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'ProgramWebPartsStrings'
import { UserMessage, WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog/AddProjectDialog'
import { Commands } from './Commands/Commands'
import styles from './ProgramAdministration.module.scss'
import { ProjectList } from './ProjectList'
import { ProgramAdministrationContext } from './context'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
  const { context, onSelectionChange } = useProgramAdministration(props)

  if (context.state.error) {
    return (
      <>
        <div className={styles.programAdministration}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <UserMessage title={strings.ErrorTitle} text={context.state.error} intent='error' />
        </div>
      </>
    )
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <ProgramAdministrationContext.Provider value={context}>
        <Commands />
        <div className={styles.programAdministration}>
          <WebPartTitle title={props.title} description={strings.ProgramAdministrationInfoMessage} />
          <div>
            {!isEmpty(context.state.childProjects) || context.state.loading ? (
              <ProjectList
                items={context.state.childProjects}
                onSelectionChange={onSelectionChange}
                searchPlaceholder={strings.ProgramAdministrationSearchBoxPlaceholder}
              />
            ) : (
              <UserMessage
                title={strings.ProgramAdministrationEmptyTitle}
                text={strings.ProgramAdministrationEmptyMessage}
              />
            )}
          </div>
          {context.state.addProjectDialog && <AddProjectDialog />}
        </div>
      </ProgramAdministrationContext.Provider>
    </FluentProvider>
  )
}
