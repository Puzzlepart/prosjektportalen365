import { Link, Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import { DocumentCard } from '@fluentui/react/lib/DocumentCard'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  if (props.shimmer) {
    return (
      <Shimmer
        className={styles.root}
        isDataLoaded={false}
        customElementsGroup={
          <div>
            <div className={styles.shimmerGroup}>
              <ShimmerElementsGroup
                shimmerElements={[{ type: ShimmerElementType.line, width: '100%', height: 100 }]}
              />
              <ShimmerElementsGroup
                shimmerElements={[{ type: ShimmerElementType.gap, width: '100%', height: 30 }]}
              />
            </div>
          </div>
        }
      />
    )
  }
  return (
    <DocumentCard
      className={styles.root}
      title={!props.project.userIsMember ? strings.NoAccessMessage : ''}
      onClickHref={props.project.userIsMember ? props.project.url : '#'}
      style={!props.project.userIsMember ? { opacity: '20%', cursor: 'default' } : {}}>
      <Link href={props.project.userIsMember ? props.project.url : '#'} target='_blank'>
        <ProjectCardHeader {...props} />
      </Link>
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  )
}
