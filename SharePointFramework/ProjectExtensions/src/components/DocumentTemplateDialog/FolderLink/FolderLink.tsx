import { Link } from '@fluentui/react-components'
import React, { FC } from 'react'
import { FOLDER_URL_ATTRIBUTE } from '../useFolderFocus'
import styles from './FolderLink.module.scss'
import { IFolderLinkProps } from './types'

/** Opens a folder and exposes its URL for focus restoration after navigating back. */
export const FolderLink: FC<IFolderLinkProps> = ({ name, url, onClick }) => (
  <Link className={styles.folderLink} onClick={onClick} {...{ [FOLDER_URL_ATTRIBUTE]: url }}>
    {name}
  </Link>
)

FolderLink.displayName = 'FolderLink'
