import { SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'
import { Link, ShimmeredDetailsList } from 'office-ui-fabric-react'
import { UserMessage } from 'pp365-projectwebparts/lib/components/UserMessage'
import * as strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useEffect, useReducer } from 'react'
import { isEmpty } from 'underscore'
import { AddProjectDialog } from './AddProjectDialog'
import { Commands } from './Commands'
import { ProgramAdministrationContext } from './context'
import { fetchChildProjects } from './data'
import styles from './ProgramAdministration.module.scss'
import { ProjectTable } from './ProjectTable'
import { IListField } from './ProjectTable/types'
import reducer, { DATA_LOADED, initState, SET_SELECTED_TO_DELETE } from './reducer'
import { IProgramAdministrationProps, shimmeredColumns } from './types'

export const ProgramAdministration: FunctionComponent<IProgramAdministrationProps> = (props) => {
  const [state, dispatch] = useReducer(reducer, initState())

  useEffect(() => {
    fetchChildProjects(props.dataAdapter).then((childProjects) =>
      dispatch(DATA_LOADED({ data: { childProjects }, scope: 'root' }))
    )
  }, [])

  if (state.error) {
    return (
      <>
        <div className={styles.root}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <UserMessage {...state.error} />
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
      <Commands />
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{props.webPartTitle}</div>
        </div>
        <div>
          {!isEmpty(state.childProjects) ? (
            <ProjectTable
              fields={fields}
              items={state.childProjects}
              selectionMode={SelectionMode.multiple}
              onSelectionChanged={(selected) => dispatch(SET_SELECTED_TO_DELETE({ selected }))}
            />
          ) : (
            <UserMessage text={strings.ProgramAdministration_EmptyMessage} />
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
