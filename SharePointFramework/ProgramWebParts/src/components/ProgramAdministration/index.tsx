import {
  MessageBar,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog'
import { columns } from './columns'
import { Commands } from './Commands'
import { ProgramAdministrationContext } from './context'
import { ListHeaderSearch } from './ListHeaderSearch'
import styles from './ProgramAdministration.module.scss'
import { TooltipHeader } from './TooltipHeader'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (
  props
) => {
  const { state, dispatch, selection, onSearch, onRenderRow } =
    useProgramAdministration(props)

  if (state.error) {
    return (
      <>
        <div className={styles.root}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <MessageBar messageBarType={state.error.messageBarType}>
            {state.error.text}
          </MessageBar>
        </div>
      </>
    )
  }

  return (
    <ProgramAdministrationContext.Provider value={{ props, state, dispatch }}>
      <Commands />
      <div className={styles.root}>
        <TooltipHeader />
        <div>
          {!isEmpty(state.childProjects) || state.loading.root ? (
            <ShimmeredDetailsList
              setKey='ProgramAdministration'
              enableShimmer={state.loading.root}
              items={state.childProjects}
              columns={columns({ renderAsLink: true })}
              selection={selection}
              selectionMode={
                state.userHasManagePermission
                  ? SelectionMode.multiple
                  : SelectionMode.none
              }
              selectionPreservedOnEmptyClick={true}
              onRenderRow={onRenderRow}
              onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
                <ListHeaderSearch
                  detailsHeaderProps={detailsHeaderProps}
                  defaultRender={defaultRender}
                  selectedCount={state.selectedProjectsToDelete?.length ?? 0}
                  search={{
                    placeholder:
                      strings.ProgramAdministrationSearchBoxPlaceholder,
                    onSearch
                  }}
                />
              )}
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
