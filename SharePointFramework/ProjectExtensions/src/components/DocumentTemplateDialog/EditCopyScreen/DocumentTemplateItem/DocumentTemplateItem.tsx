import { Field, Input } from '@fluentui/react-components'
import { FileTypeIcon, getFluentIconWithFallback } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './DocumentTemplateItem.module.scss'
import { IDocumentTemplateItemProps } from './types'
import { MAX_LENGTH, useDocumentTemplateItem } from './useDocumentTemplateItem'

/**
 * One copy to name: its file type and name as a button that opens the name and title fields, and
 * says whether they are shown (WCAG 2.1.1, 4.1.2); it was a clickable `div` the keyboard could not
 * reach.
 */
export const DocumentTemplateItem: FC<IDocumentTemplateItemProps> = (props) => {
  const {
    fieldsId,
    isExpanded,
    toggleExpanded,
    nameLength,
    titleLength,
    onNameChange,
    onTitleChange
  } = useDocumentTemplateItem(props)
  return (
    <div className={styles.root}>
      <button
        type='button'
        className={styles.header}
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={fieldsId}
      >
        <span className={styles.fileTypeIcon}>
          <FileTypeIcon {...props.item.getFileTypeIconOptions()} />
        </span>
        <span className={styles.title}>{props.item.name}</span>
        <span className={styles.chevronIcon} aria-hidden>
          {getFluentIconWithFallback(isExpanded ? 'ChevronDown' : 'ChevronUp')}
        </span>
      </button>
      <div id={fieldsId} hidden={!isExpanded}>
        <div className={styles.inputField}>
          <Field
            label={props.item.isFolder ? strings.FolderNameLabel : strings.FileNameLabel}
            validationMessage={props.item.errorMessage}
            validationState={props.item.errorMessage ? 'error' : 'none'}
          >
            <Input
              placeholder={props.item.isFolder ? strings.FolderNameLabel : strings.FileNameLabel}
              defaultValue={props.item.isFolder ? props.item.name : props.item.nameWithoutExtension}
              maxLength={MAX_LENGTH}
              contentAfter={
                props.item.isFolder
                  ? `${nameLength}/${MAX_LENGTH}`
                  : `${nameLength}/${MAX_LENGTH} .${props.item.fileExtension}`
              }
              onChange={onNameChange}
            />
          </Field>
        </div>
        <div className={styles.inputField}>
          <Field label={strings.TitleLabel}>
            <Input
              placeholder={strings.TitleLabel}
              defaultValue={props.item.title}
              maxLength={MAX_LENGTH}
              contentAfter={`${titleLength}/${MAX_LENGTH}`}
              onChange={onTitleChange}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

DocumentTemplateItem.displayName = 'DocumentTemplateItem'
