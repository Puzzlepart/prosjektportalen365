import { sortBy } from "underscore"
import { useProjectInformationContext } from "../context"
import React from "react"
import { ITerm } from '@pnp/sp/taxonomy'


type ITermWithLocalProperties = ITerm & {
  localProperties?: Array<{
    setId: string
    properties: Array<{ key: string; value: string }>
  }>
}

export function useUnSustainabilityGoals() {
  const context = useProjectInformationContext()
  const rawUnSustGoals = context.state.data.fieldValues.get('GtUNSustDevGoals')

  const [customProperties, setCustomProperties] = React.useState<{ [key: string]: any }>({})

  React.useEffect(() => {
    const fetchCustomProperties = async () => {
      if (!rawUnSustGoals?.value?.length) return

      const props: { [key: string]: any } = {}
      const termStore = context.props.sp.termStore
      const group = termStore.groups.getById('c56bb677-f782-4cf6-a6d6-17685ee9f19d') 
      const termSet = group.sets.getById('abdc8d0f-cf79-4d49-82e2-d94d9122ad65') 

      for (const entry of rawUnSustGoals.value) {
        try {
          const termId = entry.TermGuid
          if (termId) {
            const term = await termSet.getTermById(termId).select('localProperties')() as ITermWithLocalProperties
            const termSetId = 'abdc8d0f-cf79-4d49-82e2-d94d9122ad65' 
            const localProps = term.localProperties?.find(lp => lp.setId === termSetId)
            props[entry.Label] = localProps?.properties?.reduce((acc, p) => {
              acc[p.key] = p.value
              return acc
            }, {} as { [key: string]: string }) ?? {}
          }
        } catch (error) {
          console.warn(`Failed to fetch custom properties for term: ${entry.Label}`, error)
        }
      }
      setCustomProperties(props)
    }

    fetchCustomProperties()
  }, [rawUnSustGoals, context.props.sp])

  const UnSustGoals = rawUnSustGoals?.value ? {
    ...rawUnSustGoals,
    value: sortBy(rawUnSustGoals.value, (goal: any) => {
      const match = goal.Label.match(/^(\d+)\./);
      return match ? parseInt(match[1], 10) : 999;
    })
  } : rawUnSustGoals;

  return {
    UnSustGoals,
    customProperties
  }
}

