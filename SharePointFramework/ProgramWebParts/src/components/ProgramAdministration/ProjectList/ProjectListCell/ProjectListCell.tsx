import { Link } from '@fluentui/react-components'
import { formatDate, ProjectLogo } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './ProjectListCell.module.scss'
import { IProjectListCellProps } from './types'

/**
 * A cell of the program administration's project lists: the title with the project's logo, a
 * link to the site where asked; the creation date as the portfolio overview shows dates; any other
 * column's value as text. The grid's typography applies.
 */
export const ProjectListCell: FC<IProjectListCellProps> = ({ item, column, renderLinks }) => {
  switch (column.key) {
    case 'Title': {
      const url = item.SPWebURL || item.Path
      return (
        <span className={styles.title}>
          <span className={styles.logo}>
            <ProjectLogo title={item.Title} url={url} renderMode='list' size='32px' />
          </span>
          {renderLinks ? (
            <Link className={styles.text} href={url} target='_blank' title={item.Title}>
              {item.Title}
            </Link>
          ) : (
            <span className={styles.text} title={item.Title}>
              {item.Title}
            </span>
          )}
        </span>
      )
    }
    case 'Created':
      return <>{formatDate(item.Created)}</>
    default:
      return <>{item[column.fieldName] ?? ''}</>
  }
}
