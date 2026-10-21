import { useAnnounce } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'
import { useRiskActionContext } from '../../context'

/**
 * Custom hook that returns the necessary properties and functions for the MigrateRiskActionsDialog component.
 */
export function useMigrateRiskActionsDialog() {
  const { dataAdapter } = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const dialogState = useBoolean(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrateError, setMigrateError] = useState<string>()
  const { announce } = useAnnounce()
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

  /**
   * Migrates the risk actions to Planner tasks, and says how many were made (WCAG 4.1.3); a failure
   * stays in the dialog, said in a message.
   */
  const onMigrate = async () => {
    setIsMigrating(true)
    setMigrateError(undefined)
    try {
      const newTasks = await dataAdapter.addTasks(tasks, itemContext)
      const updatedItemContext = await dataAdapter.updateItem(newTasks, itemContext)
      setItemContext(updatedItemContext)
      dialogState.setFalse()
      announce(format(strings.MigrateRiskActionsDone, newTasks.length), { polite: true })
    } catch (error) {
      setMigrateError(error?.message ?? '')
    } finally {
      setIsMigrating(false)
    }
  }

  return {
    tasks,
    itemContext,
    onMigrate,
    open: dialogState.value,
    setOpen: dialogState.setValue,
    isMigrating,
    migrateError,
    separator,
    setSeparator
  }
}
