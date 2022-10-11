import { SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'
import { Link, MessageBar, ShimmeredDetailsList } from 'office-ui-fabric-react'
import * as strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent } from 'react'
import { isEmpty } from 'underscore'
import { AddProjectDialog } from './AddProjectDialog'
import { Commands } from './Commands'
import { ProgramAdministrationContext } from './context'
import styles from './ProgramAdministration.module.scss'
import { ProjectTable } from './ProjectTable'
import { IListField } from './ProjectTable/types'
import { SET_SELECTED_TO_DELETE } from './reducer'
import { IProgramAdministrationProps, shimmeredColumns } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FunctionComponent<IProgramAdministrationProps> = (props) => {
  const { state, dispatch } = useProgramAdministration(props)

  if (state.error) {
    return (
      <>
        <div className={styles.root}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <MessageBar messageBarType={state.error.messageBarType}>{state.error.text}</MessageBar>
        </div>
      </>
    )
  }

  if (state.loading.root) {
    return (
      <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
    )
  }

  return (
    <ProgramAdministrationContext.Provider value={{ props, state, dispatch }}>
      {state.userHasManagePermission && <Commands />}
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <div>
          {!isEmpty(state.childProjects) ? (
            <ProjectTable
              fields={fields}
              items={state.childProjects}
              selectionMode={
                state.userHasManagePermission ? SelectionMode.multiple : SelectionMode.none
              }
              onSelectionChanged={(selected) => dispatch(SET_SELECTED_TO_DELETE({ selected }))}
            />
          ) : (
            <MessageBar>{strings.ProgramAdministration_EmptyMessage}</MessageBar>
          )}
        </div>
        {state.displayAddProjectDialog && <AddProjectDialog />}
      </div>
    </ProgramAdministrationContext.Provider>
  )
}

export const fields: IListField[] = [
  {
    key: 'Title',
    text: 'Tittel',
    fieldName: 'Title',
    onRender: (item) => (
      <Link href={item.SPWebURL} target='_blank' rel='noreferrer'>
        {item.Title}
      </Link>
    )
  }
]
