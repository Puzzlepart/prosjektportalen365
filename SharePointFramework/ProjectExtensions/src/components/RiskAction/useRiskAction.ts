import { useId } from '@fluentui/react-components'
import { useMemo, useState } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../extensions/riskAction/context'

/** Creates the cell's provider ID and shared, editable risk-item context. */
export function useRiskAction() {
  const fluentProviderId = useId('fp-risk-action')
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
