import { isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'ProgramWebPartsStrings'
import { UserMessage, WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog/AddProjectDialog'
import { Commands } from './Commands/Commands'
import styles from './ProgramAdministration.module.scss'
import { ProjectList } from './ProjectList'
import { ProgramAdministrationContext } from './context'
import { SET_SELECTED_TO_DELETE } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
  const { context } = useProgramAdministration(props)

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
    <ProgramAdministrationContext.Provider value={context}>
      <Commands />
      <div className={styles.programAdministration}>
        <WebPartTitle title={props.title} description={strings.ProgramAdministrationInfoMessage} />
        <div>
          {!isEmpty(context.state.childProjects) || context.state.loading.root ? (
            <ProjectList
              items={context.state.childProjects}
              onSelectionChange={(_, data) => {
                context.dispatch(SET_SELECTED_TO_DELETE(data.selectedItems))
              }}
            />
          ) : (
            <UserMessage
              title={strings.ProgramAdministrationEmptyTitle}
              text={strings.ProgramAdministrationEmptyMessage}
            />
          )}
        </div>
        {context.state.displayAddProjectDialog && <AddProjectDialog />}
      </div>
    </ProgramAdministrationContext.Provider>
  )
}
