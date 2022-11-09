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
import { CHILD_PROJECTS_ADDED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './AddProjectDialog.module.scss'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { selectedProjects, availableProjects, onSearch } = useAddProjectDialog()

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
          <ScrollablePane styles={{ root: { maxHeigth: '100%' } }}>
            <ShimmeredDetailsList
              items={availableProjects}
              columns={columns({ renderAsLink: false })}
              selectionMode={SelectionMode.multiple}
              enableShimmer={context.state.loading.AddProjectDialog}
              onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
                <ListHeaderSearch
                  detailsHeaderProps={detailsHeaderProps}
                  defaultRender={defaultRender}
                  selectedCount={selectedProjects?.length ?? 0}
                  search={{
                    placeholder: 'Søk i prosjekter...',
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
          disabled={_.isEmpty(selectedProjects)}
          onClick={async () => {
            await addChildProject(context.props.dataAdapter, selectedProjects)
            context.dispatch(CHILD_PROJECTS_ADDED({ childProjects: selectedProjects }))
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
