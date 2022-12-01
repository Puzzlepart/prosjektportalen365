import { MessageBar, SelectionMode, ShimmeredDetailsList } from '@fluentui/react'
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

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
  const { context, selection, onSearch, onRenderRow } = useProgramAdministration(props)

  if (context.state.error) {
    return (
      <>
        <div className={styles.root}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <MessageBar messageBarType={context.state.error.messageBarType}>{context.state.error.text}</MessageBar>
        </div>
      </>
    )
  }

  return (
    <ProgramAdministrationContext.Provider value={context}>
      <Commands />
      <div className={styles.root}>
        <TooltipHeader />
        <div>
          {!isEmpty(context.state.childProjects) || context.state.loading.root ? (
            <ShimmeredDetailsList
              setKey='ProgramAdministration'
              enableShimmer={context.state.loading.root}
              items={context.state.childProjects}
              columns={columns({ renderAsLink: true })}
              selection={selection}
              selectionMode={
                context.state.userHasManagePermission ? SelectionMode.multiple : SelectionMode.none
              }
              selectionPreservedOnEmptyClick={true}
              onRenderRow={onRenderRow}
              onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
                <ListHeaderSearch
                  detailsHeaderProps={detailsHeaderProps}
                  defaultRender={defaultRender}
                  selectedCount={context.state.selectedProjectsToDelete?.length ?? 0}
                  search={{
                    placeholder: strings.ProgramAdministrationSearchBoxPlaceholder,
                    onSearch
                  }}
                />
              )}
            />
          ) : (
            <MessageBar>{strings.ProgramAdministrationEmptyMessage}</MessageBar>
          )}
        </div>
        {context.state.displayAddProjectDialog && <AddProjectDialog />}
      </div>
    </ProgramAdministrationContext.Provider>
  )
}
