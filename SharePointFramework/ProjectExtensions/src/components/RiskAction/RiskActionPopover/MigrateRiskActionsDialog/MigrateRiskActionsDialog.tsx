import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  ProgressBar
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import React, { FC, ReactElement, ReactNode } from 'react'
import styles from './MigrateRiskActionsDialog.module.scss'
import { useMigrateRiskActionsDialog } from './useMigrateRiskActionsDialog'
import { getFluentIcon, format } from 'pp365-shared-library'

/**
 * Migrate risk actions dialog. This dialog is used to migrate risk actions to planner tasks. Its
 * buttons stay while the tasks are made, unusable but focusable (`disabledFocusable`), so the
 * button pressed keeps the focus (WCAG 2.4.3); the bar meanwhile is named by its text. When
 * Planner refuses an action's task, it says which and why; once some actions are tasks, only the
 * close button is left, since migrating the field again would add them twice.
 */
export const MigrateRiskActionsDialog: FC<{ children?: ReactNode }> = (props) => {
  const {
    tasks,
    itemContext,
    onMigrate,
    open,
    setOpen,
    isMigrating,
    migrateError,
    refusal,
    isMigrated,
    closeButtonRef,
    progressTextId,
    separator,
    setSeparator
  } = useMigrateRiskActionsDialog()
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
                  aria-label={strings.CloseModalText}
                  icon={getFluentIcon('Dismiss')}
                  disabledFocusable={isMigrating}
                />
              </DialogTrigger>
            }
          >
            {format(strings.MigrateRiskActionsDialogTitle, itemContext.title)}
          </DialogTitle>
          <DialogContent className={styles.migrateRiskActionsDialogContent}>
            <MessageBar intent='info' className={styles.infoText}>
              <MessageBarBody>{strings.MigrateRiskActionsDialogInfoText}</MessageBarBody>
            </MessageBar>
            {!isMigrated && (
              <>
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
                    <Option value={strings.MigrateRiskActionsDialogSeparatorOptionCommaNoSpaces}>
                      {strings.MigrateRiskActionsDialogSeparatorOptionCommaNoSpaces}
                    </Option>
                  </Dropdown>
                </Field>
                <ol>
                  {tasks.map((t, index) => (
                    <li key={index}>{t}</li>
                  ))}
                </ol>
              </>
            )}
            {/* Named by the text under it, once: as a field's message the text was its
                description too, and read twice. */}
            {isMigrating && (
              <div className={styles.progress}>
                <ProgressBar aria-labelledby={progressTextId} />
                <div id={progressTextId} className={styles.progressText}>
                  {strings.MigrateRiskActionsDialogProgressText}
                </div>
              </div>
            )}
            {migrateError !== undefined && (
              <MessageBar intent='error'>
                <MessageBarBody>
                  <MessageBarTitle>{strings.MigrateRiskActionsFailed}</MessageBarTitle>
                  {migrateError}
                </MessageBarBody>
              </MessageBar>
            )}
            {refusal && (
              <MessageBar intent={refusal.intent} className={styles.refusal}>
                <MessageBarBody>
                  <MessageBarTitle>{refusal.title}</MessageBarTitle>
                  {strings.MigrateRiskActionsRefusedText}
                  <ul>
                    {refusal.actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            {!isMigrated && (
              <Button
                appearance='primary'
                onClick={onMigrate}
                disabled={tasks.length === 0}
                disabledFocusable={isMigrating}
              >
                {format(strings.MigrateRiskActionsDialogCreatePlannerTasks, tasks.length)}
              </Button>
            )}
            <DialogTrigger action='close' disableButtonEnhancement>
              <Button appearance='secondary' disabledFocusable={isMigrating} ref={closeButtonRef}>
                {strings.MigrateRiskActionsDialogCancel}
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

MigrateRiskActionsDialog.displayName = 'MigrateRiskActionsDialog'
