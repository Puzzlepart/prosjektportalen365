import {
  CommandBar,
  format,
  IColumn,
  Link,
  MessageBar,
  SearchBox,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog'
import { Commands } from './Commands'
import { ProgramAdministrationContext } from './context'
import styles from './ProgramAdministration.module.scss'
import { TooltipHeader } from './TooltipHeader'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
  const { state, dispatch, selection, onSearch, onRenderRow } = useProgramAdministration(props)

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

  return (
    <ProgramAdministrationContext.Provider value={{ props, state, dispatch }}>
      <Commands />
      <div className={styles.root}>
        <TooltipHeader />
        <div>
          <CommandBar
            items={[
              {
                key: 'cmdSearchBox',
                onRender: () => (
                  <div className={styles.searchBox}>
                    <SearchBox
                      placeholder={'Søk i underområder...'}
                      onSearch={onSearch}
                      onChange={(_, newValue) => onSearch(newValue)}
                    />
                  </div>
                )
              }
            ]}
            farItems={[
              {
                key: 'cmdSelectionCount',
                text: format(
                  strings.CmdSelectionCountText,
                  state.selectedProjectsToDelete?.length ?? 0
                )
              }
            ]}
          />
          {!isEmpty(state.childProjects) || state.loading.root ? (
            <ShimmeredDetailsList
              enableShimmer={state.loading.root}
              items={state.childProjects}
              columns={columns({ renderAsLink: true })}
              selection={selection}
              selectionMode={
                state.userHasManagePermission ? SelectionMode.multiple : SelectionMode.none
              }
              onRenderRow={onRenderRow}
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

export const columns = ({ renderAsLink = false }): IColumn[] => [
  {
    key: 'Title',
    fieldName: 'Title',
    name: 'Tittel',
    onRender: (item) =>
      renderAsLink ? (
        <Link href={item.SPWebURL} target='_blank' rel='noreferrer'>
          {item.Title}
        </Link>
      ) : (
        item.Title
      ),
    minWidth: 100
  }
]
