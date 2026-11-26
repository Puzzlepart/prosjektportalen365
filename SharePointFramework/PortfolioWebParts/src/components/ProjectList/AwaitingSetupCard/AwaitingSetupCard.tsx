import { Badge, Button, Card, CardFooter, Text } from '@fluentui/react-components'
import { ArrowRight20Regular, Clock16Regular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../ProjectCard/context'
import { ProjectCardHeader } from '../ProjectCard/ProjectCardHeader'
import styles from './AwaitingSetupCard.module.scss'

/**
 * The card of a site created for a project that the setup has not been run on: its title and
 * logo as on a project's card, that it awaits the setup, and a link to the site, where the setup
 * starts for its owner. It has none of a project's metadata, which the setup makes.
 */
export const AwaitingSetupCard: FC = () => {
  const { project } = useContext(ProjectCardContext)

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <ProjectCardHeader />
        <div className={styles.content}>
          <Badge appearance='filled' color='warning' icon={<Clock16Regular />}>
            {strings.AwaitingSetupLabel}
          </Badge>
          <Text size={200} className={styles.description}>
            {strings.AwaitingSetupDescription}
          </Text>
        </div>
        <CardFooter className={styles.footer}>
          {/* Named by the project too: several cards have the same button (WCAG 2.4.4). */}
          <Button
            as='a'
            href={project?.url}
            target='_blank'
            rel='noopener noreferrer'
            appearance='primary'
            icon={<ArrowRight20Regular />}
            iconPosition='after'
            aria-label={format(strings.CompleteSetupAriaLabel, project?.title)}
          >
            {strings.CompleteSetupLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
