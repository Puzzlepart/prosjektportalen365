import { Field, Input } from '@fluentui/react-components'
import { FileTypeIcon, getFluentIconWithFallback } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './DocumentTemplateItem.module.scss'
import { IDocumentTemplateItemProps } from './types'
import { MAX_LENGTH, useDocumentTemplateItem } from './useDocumentTemplateItem'

/**
 * One copy to name: its file type and name as a header that opens the name and title fields.
 */
export const DocumentTemplateItem: FC<IDocumentTemplateItemProps> = (props) => {
  const { nameId, titleId, isExpanded, toggleExpanded, nameLength, titleLength, onInputChange } =
    useDocumentTemplateItem(props)
  return (
    <div className={styles.root}>
      <div className={styles.header} onClick={toggleExpanded}>
        <div className={styles.fileTypeIcon}>
          <FileTypeIcon {...props.item.getFileTypeIconOptions()} />
        </div>
        <div className={styles.title}>{props.item.name}</div>
        <div className={styles.chevronIcon}>
          {getFluentIconWithFallback(isExpanded ? 'ChevronDown' : 'ChevronUp')}
        </div>
      </div>
      <div hidden={!isExpanded}>
        <div className={styles.inputField}>
          <Field
            label={props.item.isFolder ? strings.FolderNameLabel : strings.FileNameLabel}
            validationMessage={props.item.errorMessage}
            validationState={props.item.errorMessage ? 'error' : 'none'}
          >
            <Input
              id={nameId}
              placeholder={props.item.isFolder ? strings.FolderNameLabel : strings.FileNameLabel}
              defaultValue={props.item.isFolder ? props.item.name : props.item.nameWithoutExtension}
              maxLength={MAX_LENGTH}
              contentAfter={
                props.item.isFolder
                  ? `${nameLength}/${MAX_LENGTH}`
                  : `${nameLength}/${MAX_LENGTH} .${props.item.fileExtension}`
              }
              onChange={onInputChange}
            />
          </Field>
        </div>
        <div className={styles.inputField}>
          <Field label={strings.TitleLabel}>
            <Input
              id={titleId}
              placeholder={strings.TitleLabel}
              defaultValue={props.item.title}
              maxLength={MAX_LENGTH}
              contentAfter={`${titleLength}/${MAX_LENGTH}`}
              onChange={onInputChange}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

DocumentTemplateItem.displayName = 'DocumentTemplateItem'
