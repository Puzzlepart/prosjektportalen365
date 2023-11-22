import strings from 'ProjectExtensionsStrings'
import { useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { useRiskActionFieldCustomizerContext } from '../../../../riskAction/context'
import { useRiskActionContext } from '../../context'

/**
 * Custom hook that returns the necessary properties and functions for the MigrateRiskActionsDialog component.
 */
export function useMigrateRiskActionsDialog() {
  const { dataAdapter } = useRiskActionFieldCustomizerContext()
  const { itemContext, setItemContext } = useRiskActionContext()
  const dialogState = useBoolean(false)
  const [isMigrating, setIsMigrating] = useState(false)
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
   * Migrates the risk actions to Planner tasks.
   */
  const onMigrate = async () => {
    setIsMigrating(true)
    const newTasks = await dataAdapter.addTasks(tasks, itemContext)
    const updatedItemContext = await dataAdapter.updateItem(newTasks, itemContext)
    setItemContext(updatedItemContext)
    dialogState.setFalse()
    setIsMigrating(false)
  }

  return {
    tasks,
    itemContext,
    onMigrate,
    open: dialogState.value,
    setOpen: dialogState.setValue,
    isMigrating,
    separator,
    setSeparator
  }
}
