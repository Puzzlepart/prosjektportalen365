import {
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger
} from '@fluentui/react-components'
import { AddRegular, DocumentRegular } from '@fluentui/react-icons'
import React, { FC } from 'react'

/**
 * Props for the NewDocumentMenu component.
 */
export interface INewDocumentMenuProps {
  /**
   * Callback fired when a new blank document is requested.
   *
   * @param documentType - The type of document to create ('word' | 'excel' | 'powerpoint')
   */
  onCreateDocument?: (documentType: 'word' | 'excel' | 'powerpoint') => void

  /**
   * Callback fired when the upload option is selected.
   */
  onUpload?: () => void

  /**
   * Indicates whether document creation is disabled.
   */
  disabled?: boolean
}

/**
 * NewDocumentMenu provides a dropdown menu for creating new documents
 * or uploading files to the document library.
 *
 * Supports creating blank Word, Excel, and PowerPoint documents, as well
 * as triggering file upload.
 *
 * @component
 * @example
 * ```tsx
 * <NewDocumentMenu
 *   onCreateDocument={(type) => createBlankDocument(type)}
 *   onUpload={() => openUploadDialog()}
 * />
 * ```
 */
export const NewDocumentMenu: FC<INewDocumentMenuProps> = ({
  onCreateDocument,
  onUpload,
  disabled
}) => {
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          appearance='primary'
          icon={<AddRegular />}
          disabled={disabled}
          menuIcon={<DocumentRegular />}
        >
          Ny
        </MenuButton>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuItem onClick={() => onCreateDocument?.('word')}>Word-dokument</MenuItem>
          <MenuItem onClick={() => onCreateDocument?.('excel')}>Excel-arbeidsbok</MenuItem>
          <MenuItem onClick={() => onCreateDocument?.('powerpoint')}>
            PowerPoint-presentasjon
          </MenuItem>
          <MenuItem onClick={() => onUpload?.()}>Last opp fil</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
