import { IDocumentCardProps } from '@fluentui/react'
import styles from './ProjectCard.module.scss'
import * as strings from 'PortfolioWebPartsStrings'
import { useState } from 'react'
import { IProjectCardProps } from './types'

/**
 * Component logic hook for `ProjectCard`
 *
 * @param props Props
 */
export function useProjectCard(props: IProjectCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(!props.project.logo)
  const documentCardProps: IDocumentCardProps = {
    title: '',
    onClickHref: props.project.url,
    className: styles.root,
    style: {}
  }
  if (props.project.isUserMember === false) {
    documentCardProps.onClickHref = '#'
    documentCardProps.title = strings.NoAccessMessage
    documentCardProps.style = { opacity: '20%', cursor: 'default' }
  }
  return {
    isDataLoaded: props.isDataLoaded && isImageLoaded,
    setIsImageLoaded,
    documentCardProps
  } as const
}
