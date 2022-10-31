import { Icon, TextField } from '@fluentui/react'
import { getId } from '@uifabric/utilities'
import { DocumentTemplateDialogContext } from 'components/DocumentTemplateDialog/context'
import { SPDataAdapter } from 'data'
import * as strings from 'ProjectExtensionsStrings'
import React, { FormEvent, FC, useContext, useEffect, useState } from 'react'
import styles from './DocumentTemplateItem.module.scss'
import { IDocumentTemplateItemProps } from './types'

export const DocumentTemplateItem: FC<IDocumentTemplateItemProps> = (props) => {
  const { state } = useContext(DocumentTemplateDialogContext)
  const nameId = getId('name')
  const titleId = getId('title')
  let changeTimeout: any
  const [isExpanded, setIsExpanded] = useState(false)

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
    changeTimeout = setTimeout(async () => {
      // eslint-disable-next-line default-case
      switch ((event.target as HTMLInputElement).id) {
        case nameId:
          {
            const newName = `${newValue}.${props.item.fileExtension}`
            const errorMsg = await SPDataAdapter.isFilenameValid(state.targetFolder, newName)
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
    SPDataAdapter.isFilenameValid(state.targetFolder, props.item.name).then((errorMessage) => {
      if (errorMessage) {
        props.onInputChanged(props.item.id, {}, errorMessage)
        setIsExpanded(true)
      }
    })
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
            label={strings.FileNameLabel}
            placeholder={strings.FileNameLabel}
            defaultValue={props.item.nameWithoutExtension}
            suffix={`.${props.item.fileExtension}`}
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
            onChange={onInputChange}
          />
        </div>
      </div>
    </div>
  )
}
