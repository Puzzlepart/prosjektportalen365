import * as strings from 'PortfolioWebPartsStrings'
import { CSSProperties, useState } from 'react'
import { IProjectCardProps } from './types'

/**
 * Component logic hook for `ProjectCard`
 *
 * @param props Props
 */
export function useProjectCard(props: IProjectCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(!props.project.logo)
  let title = ''
  let href = props.project.url
  let style: CSSProperties = {}
  if (!props.project.userIsMember) {
    href = '#'
    title = strings.NoAccessMessage
    style = { opacity: '20%', cursor: 'default' }
  }
  return { isDataLoaded: props.isDataLoaded && isImageLoaded, setIsImageLoaded, title, href, style }
}
