import {
  Text,
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  CardProps,
  Checkbox
} from '@fluentui/react-components'
import React, { useContext } from 'react'
import { ProjectProvisionContext } from '../../context'
import styles from './SiteType.module.scss'

export const SiteType = (
  props: CardProps & { title: string; type: string; description: string; image: string }
) => {
  const context = useContext(ProjectProvisionContext)

  return (
    <Card
      className={styles.card}
      selected={context.column.get('type') === props.type}
      onSelectionChange={() => context.setColumn('type', props.type)}
      floatingAction={
        <Checkbox shape='circular' checked={context.column.get('type') === props.type} />
      }
    >
      <CardPreview className={styles.grayBackground}>
        <img className={styles.smallRadius} src={props.image} alt={`Bilde for ${props.title}`} />
      </CardPreview>
      <CardHeader
        header={<Text weight='semibold'>{props.title}</Text>}
        description={<Caption1 className={styles.caption}>{props.description}</Caption1>}
      />
    </Card>
  )
}
