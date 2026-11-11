import { Link } from '@fluentui/react-components'
import React, { FC } from 'react'
import { FOLDER_URL_ATTRIBUTE } from '../useFolderFocus'
import styles from './FolderLink.module.scss'
import { IFolderLinkProps } from './types'

/**
 * A folder's name in a list of folders, which opens it. At least 24px tall (WCAG 2.5.8): as text
 * in the row it was 16px, beside the row's check box. Marked with its URL, so going back up gives
 * it the focus (`useFolderFocus`).
 */
export const FolderLink: FC<IFolderLinkProps> = ({ name, url, onClick }) => (
  <Link className={styles.folderLink} onClick={onClick} {...{ [FOLDER_URL_ATTRIBUTE]: url }}>
    {name}
  </Link>
)

FolderLink.displayName = 'FolderLink'
