import { sortBy } from "underscore"
import { useProjectInformationContext } from "../context"

export function useUnSustainabilityGoals() {
  const context = useProjectInformationContext()
  const rawUnSustGoals = context.state.data.fieldValues.get('GtUNSustDevGoals')

  const UnSustGoals = rawUnSustGoals?.value ? {
    ...rawUnSustGoals,
    value: sortBy(rawUnSustGoals.value, (goal: any) => {
      const match = goal.Label.match(/^(\d+)\./);
      return match ? parseInt(match[1], 10) : 999;
    })
  } : rawUnSustGoals;

  return {
    UnSustGoals
  }
}

