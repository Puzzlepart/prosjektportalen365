import { useId } from '@fluentui/react-components'
import { useMemo, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../riskAction/context'

/**
 * Custom hook for managing risk action functionality.
 *
 * @returns An object containing the fluentProviderId and contextValue.
 */
export function useRiskAction() {
  const fluentProviderId = useId('risk-action-fluent-provider')
  const context = useRiskActionFieldCustomizerContext()
  const [itemContext, setItemContext] = useState(context.itemContext)
  const contextValue = useMemo(
    () => ({
      itemContext,
      setItemContext
    }),
    [itemContext]
  )
  return { fluentProviderId, contextValue }
}
