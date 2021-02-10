import { getId } from '@uifabric/utilities'
import { SPDataAdapter } from 'data'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import * as strings from 'ProjectExtensionsStrings'
import React, { useState, useEffect, FormEvent } from 'react'
import styles from './DocumentTemplateItem.module.scss'
import { IDocumentTemplateItemProps } from './types'

export const DocumentTemplateItem = (props: IDocumentTemplateItemProps) => {
  const nameId = getId('name')
  const titleId = getId('title')
  let changeTimeout: number
  const [isExpanded, setIsExpanded] = useState(false)

  /**
   * On input change
   *
   * @param {React.FormEvent} event Event
   * @param {string} newValue New value
   * @param {number} resolveDelay Resolve delay in ms
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
            const errorMsg = await SPDataAdapter.isFilenameValid(
              props.folderServerRelativeUrl,
              newName
            )
            props.onInputChanged(props.item.id, { newName }, errorMsg)
          }
          break
        case titleId: props.onInputChanged(props.item.id, { newTitle: newValue })
          break
      }
    }, resolveDelay)
  }

  useEffect(() => {
    SPDataAdapter.isFilenameValid(props.folderServerRelativeUrl, props.item.name).then(
      (errorMessage) => {
        if (errorMessage) {
          props.onInputChanged(props.item.id, {}, errorMessage)
          setIsExpanded(true)
        }
      }
    )
  }, [props.folderServerRelativeUrl])

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
            label={strings.NameLabel}
            placeholder={strings.NameLabel}
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
