import { Text, Caption1, Card, CardHeader, CardPreview, Checkbox } from '@fluentui/react-components'
import React, { FC, useContext } from 'react'
import { ProjectProvisionContext } from '../../context'
import styles from './SiteType.module.scss'
import { ISiteType } from './types'

export const SiteType: FC<ISiteType> = (props) => {
  const context = useContext(ProjectProvisionContext)
  const isMinimal = context.props.siteTypeRenderMode === 'cardMinimal'

  return (
    <Card
      className={styles.card}
      title={`${props.title} - ${props.description}`}
      selected={context.column.get('type') === props.title}
      onSelectionChange={() => context.setColumn('type', props.title)}
      floatingAction={
        <Checkbox shape='circular' checked={context.column.get('type') === props.title} />
      }
    >
      {!isMinimal && (
        <CardPreview className={styles.grayBackground}>
          <img className={styles.smallRadius} src={props.image} alt={props.title} />
        </CardPreview>
      )}
      <CardHeader
        header={<Text weight='semibold'>{props.title}</Text>}
        description={<Caption1 className={styles.caption}>{props.description}</Caption1>}
      />
    </Card>
  )
}
