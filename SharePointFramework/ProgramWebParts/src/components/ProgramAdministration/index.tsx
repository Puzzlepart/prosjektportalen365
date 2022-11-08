import { SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'
import { Icon, Link, MessageBar, ShimmeredDetailsList, TooltipHost } from '@fluentui/react'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog'
import { Commands } from './Commands'
import { ProgramAdministrationContext } from './context'
import styles from './ProgramAdministration.module.scss'
import { ProjectTable } from './ProjectTable'
import { IListField } from './ProjectTable/types'
import { SET_SELECTED_TO_DELETE } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'
import { isEmpty } from '@microsoft/sp-lodash-subset'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
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
      <ShimmeredDetailsList
        items={[]}
        shimmerLines={15}
        columns={[
          {
            key: 'Title',
            name: 'Tittel',
            maxWidth: 250,
            minWidth: 100
          }
        ]}
        enableShimmer
      />
    )
  }

  return (
    <ProgramAdministrationContext.Provider value={{ props, state, dispatch }}>
      <Commands />
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>
            <TooltipHost content={<div><p>{strings.ProgramAdministrationInfoMessage}</p></div>}>
              <span>{props.title}</span>
              <Icon iconName='Info' className={styles.icon} />
            </TooltipHost>
          </div>
        </div>
        <div>
          {!isEmpty(state.childProjects) ? (
            <ProjectTable
              fields={fields({ renderAsLink: true })}
              items={state.childProjects}
              selectionMode={
                state.userHasManagePermission ? SelectionMode.multiple : SelectionMode.none
              }
              onSelectionChanged={(selected) => dispatch(SET_SELECTED_TO_DELETE({ selected }))}
            />
          ) : (
            <MessageBar>{strings.ProgramAdministrationEmptyMessage}</MessageBar>
          )}
        </div>
        {state.displayAddProjectDialog && <AddProjectDialog />}
      </div>
    </ProgramAdministrationContext.Provider>
  )
}

export const fields = ({ renderAsLink = false }): IListField[] => [
  {
    key: 'Title',
    text: 'Tittel',
    fieldName: 'Title',
    onRender: (item) =>
      renderAsLink ? (
        <Link href={item.SPWebURL} target='_blank' rel='noreferrer'>
          {item.Title}
        </Link>
      ) : (
        item.Title
      )
  }
]
