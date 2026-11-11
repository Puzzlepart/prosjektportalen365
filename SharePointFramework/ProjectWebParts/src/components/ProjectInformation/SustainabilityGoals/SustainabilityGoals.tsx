import { Text, Tooltip } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './SustainabilityGoals.module.scss'
import { useSustainabilityGoals } from './useSustainabilityGoals'

/** Displays the project's selected UN Sustainable Development Goals. */
export const SustainabilityGoals: FC = () => {
  const { goals, iconSize, title } = useSustainabilityGoals()
  if (!title || goals.length === 0) return null

  return (
    <section className={styles.root}>
      <Text as='h3' className={styles.title} weight='semibold' size={200}>
        {title}
      </Text>
      <div className={styles.goals} role='list'>
        {goals.map((goal) => (
          <Tooltip key={goal.id} content={goal.name} relationship='description' withArrow>
            <span
              className={styles.goal}
              role='listitem'
              style={{ width: iconSize, height: iconSize }}
            >
              <img
                className={styles.goalIcon}
                src={goal.iconUrl}
                alt={goal.name}
                width={iconSize}
                height={iconSize}
              />
            </span>
          </Tooltip>
        ))}
      </div>
    </section>
  )
}
