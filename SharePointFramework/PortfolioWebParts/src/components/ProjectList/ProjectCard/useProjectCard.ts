import * as strings from 'PortfolioWebPartsStrings'
import { CSSProperties, useState } from 'react'
import { IProjectCardProps } from './types'

export function useProjectCard(props: IProjectCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  let title = ''
  let href = props.project.url
  let style: CSSProperties = {}
  if (!props.project.userIsMember) {
    href = '#'
    title = strings.NoAccessMessage
    style = { opacity: '20%', cursor: 'default' }
  }
  return { shimmer: props.shimmer || !isImageLoaded, setIsImageLoaded, title, href, style }
}
