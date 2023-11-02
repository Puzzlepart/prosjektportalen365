import { SelectionMode, ShimmeredDetailsList } from '@fluentui/react'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'ProgramWebPartsStrings'
import { UserMessage, WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog/AddProjectDialog'
import { Commands } from './Commands/Commands'
import { ListHeaderSearch } from './ListHeaderSearch/ListHeaderSearch'
import styles from './ProgramAdministration.module.scss'
import { columns } from './columns'
import { ProgramAdministrationContext } from './context'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
  const { state, dispatch, selection, onSearch, onRenderRow } = useProgramAdministration(props)

  if (state.error) {
    return (
      <>
        <div className={styles.root}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <UserMessage title={strings.ErrorTitle} text={state.error} intent='error' />
        </div>
      </>
    )
  }

  return (
    <ProgramAdministrationContext.Provider value={{ props, state, dispatch }}>
      <Commands />
      <div className={styles.root}>
        <WebPartTitle title={props.title} description={strings.ProgramAdministrationInfoMessage} />
        <div>
          {!isEmpty(state.childProjects) || state.loading.root ? (
            <ShimmeredDetailsList
              setKey='ProgramAdministration'
              enableShimmer={state.loading.root}
              items={state.childProjects}
              columns={columns({ renderAsLink: true })}
              selection={selection}
              selectionMode={
                state.userHasManagePermission ? SelectionMode.multiple : SelectionMode.none
              }
              selectionPreservedOnEmptyClick={true}
              onRenderRow={onRenderRow}
              onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
                <ListHeaderSearch
                  selectedItems={state.selectedProjectsToDelete}
                  detailsHeaderProps={detailsHeaderProps}
                  defaultRender={defaultRender}
                  search={{
                    placeholder: strings.ProgramAdministrationSearchBoxPlaceholder,
                    onSearch
                  }}
                />
              )}
            />
          ) : (
            <UserMessage
              title={strings.ProgramAdministrationEmptyTitle}
              text={strings.ProgramAdministrationEmptyMessage}
            />
          )}
        </div>
        {state.displayAddProjectDialog && <AddProjectDialog />}
      </div>
    </ProgramAdministrationContext.Provider>
  )
}
