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
import { ProjectProvisionContext } from '../context'
import styles from './SiteType.module.scss'

export const SiteType = (
  props: CardProps & { title: string; type: string; description: string; logo: string }
) => {
  const context = useContext(ProjectProvisionContext)

  const resolveAsset = (asset: string) => {
    const ASSET_URL =
      'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/assets/'

    return `${ASSET_URL}${asset}`
  }

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
        <img
          className={styles.smallRadius}
          src={resolveAsset(props.logo)}
          alt={`Preview image for ${props.title}`}
        />
      </CardPreview>
      <CardHeader
        header={<Text weight='semibold'>{props.title}</Text>}
        description={<Caption1 className={styles.caption}>{props.description}</Caption1>}
      />
    </Card>
  )
}
