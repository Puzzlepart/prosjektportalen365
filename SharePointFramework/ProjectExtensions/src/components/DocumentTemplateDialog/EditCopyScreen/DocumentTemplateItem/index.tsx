import { Icon, TextField } from '@fluentui/react'
import { getId } from '@uifabric/utilities'
import { DocumentTemplateDialogContext } from 'components/DocumentTemplateDialog/context'
import { SPDataAdapter } from 'data'
import * as strings from 'ProjectExtensionsStrings'
import React, { FormEvent, FC, useContext, useEffect, useState } from 'react'
import styles from './DocumentTemplateItem.module.scss'
import { IDocumentTemplateItemProps } from './types'

const MAX_LENGTH = 255

export const DocumentTemplateItem: FC<IDocumentTemplateItemProps> = (props) => {
  const { state } = useContext(DocumentTemplateDialogContext)
  const nameId = getId('name')
  const titleId = getId('title')
  let changeTimeout: any
  const [isExpanded, setIsExpanded] = useState(false)
  const [nameLength, setNameLength] = useState(
    (props.item.isFolder ? props.item.name : props.item.nameWithoutExtension)?.length || 0
  )
  const [titleLength, setTitleLength] = useState(props.item.title?.length || 0)

  /**
   * On input change
   *
   * @param event Event
   * @param newValue New value
   * @param resolveDelay Resolve delay in ms
   */
  function onInputChange(
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue: string,
    resolveDelay: number = 400
  ) {
    clearTimeout(changeTimeout)
    const targetId = (event.target as HTMLInputElement).id
    if (targetId === nameId) setNameLength(newValue?.length || 0)
    if (targetId === titleId) setTitleLength(newValue?.length || 0)
    changeTimeout = setTimeout(async () => {
      switch (targetId) {
        case nameId:
          {
            const newName = props.item.isFolder
              ? newValue
              : `${newValue}.${props.item.fileExtension}`

            const errorMsg = await SPDataAdapter.isFilenameValid(
              state.targetFolder,
              newName,
              props.item.isFolder
            )
            props.onInputChanged(props.item.id, { newName }, errorMsg)
          }
          break
        case titleId:
          props.onInputChanged(props.item.id, { newTitle: newValue })
          break
      }
    }, resolveDelay)
  }

  useEffect(() => {
    SPDataAdapter.isFilenameValid(state.targetFolder, props.item.name, props.item.isFolder).then(
      (errorMessage) => {
        props.onInputChanged(props.item.id, {}, errorMessage)
        if (errorMessage) {
          setIsExpanded(true)
        }
      }
    )
  }, [state.targetFolder])

  return (
    <div className={styles.root}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.fileTypeIcon}>
          <Icon {...props.item.getIconProps()} />
        </div>
        <div className={styles.title}>{props.item.name}</div>
        <div className={styles.chevronIcon}>
          <Icon iconName={isExpanded ? 'ChevronDown' : 'ChevronUp'} />
        </div>
      </div>
      <div hidden={!isExpanded}>
        <div className={styles.inputField}>
          <TextField
            id={nameId}
            label={props.item.isFolder ? strings.FolderNameLabel : strings.FileNameLabel}
            placeholder={props.item.isFolder ? strings.FolderNameLabel : strings.FileNameLabel}
            defaultValue={props.item.isFolder ? props.item.name : props.item.nameWithoutExtension}
            maxLength={MAX_LENGTH}
            suffix={
              props.item.isFolder
                ? `${nameLength}/${MAX_LENGTH}`
                : `${nameLength}/${MAX_LENGTH} .${props.item.fileExtension}`
            }
            errorMessage={props.item.errorMessage}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.inputField}>
          <TextField
            id={titleId}
            label={strings.TitleLabel}
            placeholder={strings.TitleLabel}
            defaultValue={props.item.title}
            maxLength={MAX_LENGTH}
            suffix={`${titleLength}/${MAX_LENGTH}`}
            onChange={onInputChange}
          />
        </div>
      </div>
    </div>
  )
}
