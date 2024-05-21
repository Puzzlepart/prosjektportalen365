import {
  Text,
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  CardProps,
  Checkbox,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components'
import React, { useContext } from 'react'
import { ProjectProvisionContext } from '../context'

export const useStyles = makeStyles({
  card: {
    width: '168px',
    maxWidth: '100%',
    height: 'fit-content'
  },

  caption: {
    color: tokens.colorNeutralForeground3
  },

  smallRadius: {
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    maxHeight: '82px'
  },

  grayBackground: {
    backgroundColor: tokens.colorNeutralBackground3
  }
})

export const SiteType = (
  props: CardProps & { title: string; type: string; description: string; logo: string }
) => {
  const context = useContext(ProjectProvisionContext)
  const styles = useStyles()

  const resolveAsset = (asset: string) => {
    const ASSET_URL =
      'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/assets/'

    return `${ASSET_URL}${asset}`
  }

  return (
    <Card
      className={styles.card}
      selected={context.state.siteType === props.type}
      onSelectionChange={() => context.setState({ siteType: props.type })}
      floatingAction={<Checkbox shape='circular' checked={context.state.siteType === props.type} />}
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
