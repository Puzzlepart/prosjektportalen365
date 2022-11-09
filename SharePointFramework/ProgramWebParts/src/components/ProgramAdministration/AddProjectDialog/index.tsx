import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import _ from 'lodash'
import { ScrollablePane } from 'office-ui-fabric-react'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC, useContext } from 'react'
import { columns } from '../columns'
import { ProgramAdministrationContext } from '../context'
import { addChildProject } from '../data'
import { ListHeaderSearch } from '../ListHeaderSearch'
import { ADD_CHILD_PROJECTS, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './AddProjectDialog.module.scss'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { selection, availableProjects, onSearch, onRenderRow } = useAddProjectDialog()

  return (
    <Dialog
      hidden={false}
      modalProps={{
        containerClassName: styles.root
      }}
      onDismiss={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
      minWidth='60em'
      maxWidth='1000px'
      dialogContentProps={{
        type: DialogType.largeHeader,
        title: strings.ProgramAdministrationAddChildsButtonText
      }}>
      <div className={styles.dialogContent}>
        <ScrollablePane>
          <ShimmeredDetailsList
            setKey='AddProjectDialog'
            items={availableProjects}
            columns={columns({ renderAsLink: false })}
            selectionMode={SelectionMode.multiple}
            selection={selection}
            enableShimmer={context.state.loading.AddProjectDialog}
            selectionPreservedOnEmptyClick={true}
            onRenderRow={onRenderRow}
            onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
              <ListHeaderSearch
                detailsHeaderProps={detailsHeaderProps}
                defaultRender={defaultRender}
                selectedCount={context.state.selectedProjectsToAdd?.length ?? 0}
                search={{
                  placeholder: strings.AddProjectDialogSearchBoxPlaceholder,
                  onSearch
                }}
              />
            )}
          />
        </ScrollablePane>
      </div>
      <DialogFooter>
        <PrimaryButton
          text={strings.Add}
          disabled={_.isEmpty(context.state.selectedProjectsToAdd)}
          onClick={async () => {
            await addChildProject(context.props.dataAdapter, context.state.selectedProjectsToAdd)
            context.dispatch(ADD_CHILD_PROJECTS())
          }}
        />
        <DefaultButton
          text={strings.Cancel}
          onClick={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
        />
      </DialogFooter>
    </Dialog>
  )
}
