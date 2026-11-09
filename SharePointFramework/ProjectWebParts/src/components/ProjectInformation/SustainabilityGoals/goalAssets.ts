import goal1Icon from '../../../../../../assets/icons/Un1Poverty.svg'
import goal2Icon from '../../../../../../assets/icons/Un2Hunger.svg'
import goal3Icon from '../../../../../../assets/icons/Un3Health.svg'
import goal4Icon from '../../../../../../assets/icons/Un4Education.svg'
import goal5Icon from '../../../../../../assets/icons/Un5Gender.svg'
import goal6Icon from '../../../../../../assets/icons/Un6Water.svg'
import goal7Icon from '../../../../../../assets/icons/Un7Energy.svg'
import goal8Icon from '../../../../../../assets/icons/Un8Growth.svg'
import goal9Icon from '../../../../../../assets/icons/Un9Innovation.svg'
import goal10Icon from '../../../../../../assets/icons/Un10Equality.svg'
import goal11Icon from '../../../../../../assets/icons/Un11Sustainability.svg'
import goal12Icon from '../../../../../../assets/icons/Un12Consumption.svg'
import goal13Icon from '../../../../../../assets/icons/Un13Climate.svg'
import goal14Icon from '../../../../../../assets/icons/Un14SeaLife.svg'
import goal15Icon from '../../../../../../assets/icons/Un15LandLife.svg'
import goal16Icon from '../../../../../../assets/icons/Un16Justice.svg'
import goal17Icon from '../../../../../../assets/icons/Un17Cooperation.svg'

export interface ISustainabilityGoal {
  id: string
  name: string
  number: number
  iconUrl: string
}

interface ITaxonomyTerm {
  key?: string
  name?: string
}

const GOAL_ICONS: Record<number, string> = {
  1: goal1Icon,
  2: goal2Icon,
  3: goal3Icon,
  4: goal4Icon,
  5: goal5Icon,
  6: goal6Icon,
  7: goal7Icon,
  8: goal8Icon,
  9: goal9Icon,
  10: goal10Icon,
  11: goal11Icon,
  12: goal12Icon,
  13: goal13Icon,
  14: goal14Icon,
  15: goal15Icon,
  16: goal16Icon,
  17: goal17Icon
}

/**
 * Maps selected taxonomy terms to their local sustainability-goal assets.
 */
export function getSustainabilityGoals(value: unknown): ISustainabilityGoal[] {
  if (!Array.isArray(value)) return []

  const goalNumbers = new Set<number>()
  return value
    .map((term: ITaxonomyTerm) => {
      const name = typeof term?.name === 'string' ? term.name.trim() : ''
      const number = Number.parseInt(name.match(/^0?(\d{1,2})(?:\D|$)/)?.[1], 10)
      const iconUrl = GOAL_ICONS[number]
      if (!name || !iconUrl || goalNumbers.has(number)) return null

      goalNumbers.add(number)
      return {
        id: term.key || `sustainability-goal-${number}`,
        name,
        number,
        iconUrl
      }
    })
    .filter(Boolean)
    .sort((left, right) => left.number - right.number)
}
