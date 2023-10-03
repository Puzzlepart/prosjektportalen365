import { useId } from '@fluentui/react-components'
import { useMemo, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../context'

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
