import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
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
import { format } from '@fluentui/react'
import { getFluentIcon } from 'pp365-shared-library'

/**
 * Migrate risk actions dialog. This dialog is used to migrate risk actions to planner tasks.
 */
export const MigrateRiskActionsDialog: FC = (props) => {
  const { tasks, itemContext, onMigrate, open, setOpen, isMigrating, separator,setSeparator } =
    useMigrateRiskActionsDialog()
  return (
    <Dialog open={open} onOpenChange={(_, { open }) => setOpen(open)}>
      <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
      <DialogSurface className={styles.migrateRiskActionsDialog}>
        <DialogBody className={styles.migrateRiskActionsDialogBody}>
          <DialogTitle
            className={styles.migrateRiskActionsDialogTitle}
            action={
              <DialogTrigger action='close' disableButtonEnhancement>
                <Button
                  appearance='subtle'
                  aria-label='close'
                  icon={getFluentIcon('Dismiss')}
                  disabled={isMigrating}
                />
              </DialogTrigger>
            }
          >
            {itemContext.title}
          </DialogTitle>
          <DialogContent className={styles.migrateRiskActionsDialogContent}>
            <Alert intent='info' className={styles.infoText}>
              {strings.MigrateRiskActionsDialogInfoText}
            </Alert>
            <Field label={strings.MigrateRiskActionsDialogSeparatorLabel}>
              <Dropdown
                disabled={isMigrating}
                defaultValue={separator}
                defaultSelectedOptions={[separator]}
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
              {tasks.map((t, index) => (
                <li key={index}>{t}</li>
              ))}
            </ol>
            {isMigrating ? (
              <div className={styles.progress}>
                <Field
                  validationMessage={strings.MigrateRiskActionsDialogProgressText}
                  validationState='none'
                >
                  <ProgressBar />
                </Field>
              </div>
            ) : (
              <div className={styles.actions}>
                <Button
                  appearance='primary'
                  onClick={onMigrate}
                  disabled={tasks.length === 0 || isMigrating}
                >
                  {format(strings.MigrateRiskActionsDialogCreatePlannerTasks, tasks.length)}
                </Button>
                <DialogTrigger action='close' disableButtonEnhancement>
                  <Button appearance='secondary' disabled={isMigrating}>
                    {strings.MigrateRiskActionsDialogCancel}
                  </Button>
                </DialogTrigger>
              </div>
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

MigrateRiskActionsDialog.displayName = 'MigrateRiskActionsDialog'
