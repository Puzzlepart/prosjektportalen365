import { Link } from '@fluentui/react-components'
import React, { FC } from 'react'
import { FOLDER_URL_ATTRIBUTE } from '../useFolderFocus'
import styles from './FolderLink.module.scss'
import { IFolderLinkProps } from './types'

/**
 * Opens a folder and exposes its URL for focus restoration after navigating back. A name longer
 * than its column ends in «…», whole in the link's tooltip: it was cut off mid-letter, with the
 * text spacing of WCAG 1.4.12 at least.
 */
export const FolderLink: FC<IFolderLinkProps> = ({ name, url, onClick }) => (
  <Link
    className={styles.folderLink}
    onClick={onClick}
    title={name}
    {...{ [FOLDER_URL_ATTRIBUTE]: url }}
  >
    <span className={styles.name}>{name}</span>
  </Link>
)

FolderLink.displayName = 'FolderLink'
