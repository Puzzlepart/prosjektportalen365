import {
  Button,
  Dialog,
  DialogSurface,
  DialogTrigger,
  Dropdown,
  Field,
  Option,
  ProgressBar
} from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import strings from 'ProjectExtensionsStrings'
import React, { FC, ReactElement } from 'react'
import styles from './MigrateRiskActionsDialog.module.scss'
import { useMigrateRiskActionsDialog } from './useMigrateRiskActionsDialog'

export const MigrateRiskActionsDialog: FC = (props) => {
  const { tasks, itemContext, onMigrate, open, setOpen, onCloseDialog, isMigrating, setSeparator } =
    useMigrateRiskActionsDialog()
  return (
    <Dialog open={open} onOpenChange={(_, { open }) => setOpen(open)}>
      <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
      <DialogSurface>
        <div className={styles.migrateRiskActionsDialog}>
          <div className={styles.title}>{itemContext.title}</div>
          <Alert intent='info' className={styles.infoText}>
            {strings.MigrateRiskActionsDialogInfoText}
          </Alert>
          <Field label={strings.MigrateRiskActionsDialogSeparatorLabel}>
            <Dropdown
              defaultValue={strings.MigrateRiskActionsDialogSeparatorOptionLinebreak}
              onOptionSelect={(_, data) => setSeparator(data.optionText)}
            >
              <Option value={strings.MigrateRiskActionsDialogSeparatorOptionLinebreak}>
                {strings.MigrateRiskActionsDialogSeparatorOptionLinebreak}
              </Option>
              <Option value={strings.MigrateRiskActionsDialogSeparatorOptionComma}>
                {strings.MigrateRiskActionsDialogSeparatorOptionComma}
              </Option>
            </Dropdown>
          </Field>
          <ol>
            {tasks.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
          {isMigrating ? (
            <div className={styles.progress} hidden={!isMigrating}>
              <Field
                validationMessage={strings.MigrateRiskActionsDialogProgressText}
                validationState='none'
              >
                <ProgressBar />
              </Field>
            </div>
          ) : (
            <div className={styles.actions} hidden={isMigrating}>
              <Button appearance='primary' onClick={onMigrate}>
                {strings.MigrateRiskActionsDialogCreatePlannerTasks}
              </Button>
              <Button appearance='secondary' onClick={onCloseDialog}>
                {strings.MigrateRiskActionsDialogCancel}
              </Button>
            </div>
          )}
        </div>
      </DialogSurface>
    </Dialog>
  )
}
