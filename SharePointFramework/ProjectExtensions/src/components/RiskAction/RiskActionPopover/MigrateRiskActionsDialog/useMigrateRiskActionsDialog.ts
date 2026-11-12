import { MessageBarIntent, useAnnounce, useId } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useEffect, useRef, useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { RiskActionTasksResult } from '../../../../extensions/riskAction/types'
import { useRiskActionContext } from '../../context'

/**
 * A migration Planner refused one or more actions of: how many actions there were, and what was
 * added and refused.
 */
interface IMigrationOutcome extends RiskActionTasksResult {
  total: number
}

/** Migrates action text to tasks, retaining refused actions and managing partial-success feedback. */
export function useMigrateRiskActionsDialog() {
  const { dataAdapter } = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const dialogState = useBoolean(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrateError, setMigrateError] = useState<string>()
  const [outcome, setOutcome] = useState<IMigrationOutcome>()
  const { announce } = useAnnounce()
  const progressTextId = useId('migrate-progress-text')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  // Some actions are tasks now: migrating the field again would add them twice.
  const isMigrated = outcome?.added.length > 0
  const [separator, setSeparator] = useState(
    strings.MigrateRiskActionsDialogSeparatorOptionLinebreak
  )
  const tasks = itemContext.fieldValue
    .split(
      separator === strings.MigrateRiskActionsDialogSeparatorOptionLinebreak
        ? '\n'
        : separator === strings.MigrateRiskActionsDialogSeparatorOptionCommaNoSpaces
          ? ','
          : ', '
    )
    .filter(Boolean)

  // The button pressed goes with the form once some actions are tasks: the close button takes the
  // focus (WCAG 2.4.3).
  useEffect(() => {
    if (isMigrated) closeButtonRef.current?.focus()
  }, [isMigrated])

  /**
   * Saves successful task references while keeping refused actions as text on the risk.
   */
  const onMigrate = async () => {
    setIsMigrating(true)
    setMigrateError(undefined)
    setOutcome(undefined)
    try {
      const result = await dataAdapter.addTasks(tasks, itemContext)
      if (result.added.length > 0) {
        const kept = result.refused.map(({ title }) => title)
        setItemContext(await dataAdapter.updateItem(result.added, itemContext, kept))
      }
      if (result.refused.length > 0) {
        setOutcome({ ...result, total: tasks.length })
      } else {
        dialogState.setFalse()
        announce(format(strings.MigrateRiskActionsDone, result.added.length), { polite: true })
      }
    } catch (error) {
      setMigrateError(error?.message ?? '')
    } finally {
      setIsMigrating(false)
    }
  }

  const setOpen = (open: boolean) => {
    if (open) {
      setMigrateError(undefined)
      setOutcome(undefined)
    }
    dialogState.setValue(open)
  }

  const refusal: { intent: MessageBarIntent; title: string; actions: string[] } = outcome && {
    intent: isMigrated ? 'warning' : 'error',
    title: isMigrated
      ? format(strings.MigrateRiskActionsPartlyDone, outcome.added.length, outcome.total)
      : strings.MigrateRiskActionsFailed,
    actions: outcome.refused.map(({ title, reason }) =>
      format(strings.MigrateRiskActionsRefusedAction, title, reason)
    )
  }

  return {
    tasks,
    itemContext,
    onMigrate,
    open: dialogState.value,
    setOpen,
    isMigrating,
    migrateError,
    refusal,
    isMigrated,
    closeButtonRef,
    progressTextId,
    separator,
    setSeparator
  }
}
