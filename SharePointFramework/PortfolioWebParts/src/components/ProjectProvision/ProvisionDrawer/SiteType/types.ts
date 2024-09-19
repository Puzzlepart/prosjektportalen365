import { CardProps } from '@fluentui/react-components'

export interface ISiteType extends CardProps {
  title: string
  type: string
  description: string
  image: string
}
