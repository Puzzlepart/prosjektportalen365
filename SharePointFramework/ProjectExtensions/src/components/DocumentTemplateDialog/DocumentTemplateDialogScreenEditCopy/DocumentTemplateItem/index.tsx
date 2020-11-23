import { getId } from '@uifabric/utilities'
import { SPDataAdapter } from 'data'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import * as strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import styles from './DocumentTemplateItem.module.scss'
import { IDocumentTemplateItemProps } from './IDocumentTemplateItemProps'

// tslint:disable-next-line: naming-convention
export const DocumentTemplateItem = (props: IDocumentTemplateItemProps) => {
  const nameId = getId('name')
  const titleId = getId('title')
  let changeTimeout: number
  const [isExpanded, setIsExpanded] = React.useState(false)

  /**
   * On input change
   *
   * @param {React.FormEvent} event Event
   * @param {string} newValue New value
   * @param {number} resolveDelay Resolve delay
   */
  function onInputChange(
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue: string,
    resolveDelay = 400
  ) {
    clearTimeout(changeTimeout)
    changeTimeout = setTimeout(async () => {
      // eslint-disable-next-line default-case
      switch ((event.target as HTMLInputElement).id) {
        case nameId:
          {
            const newName = `${newValue}.${props.model.fileExtension}`
            const errorMsg = await SPDataAdapter.isFilenameValid(
              props.folderServerRelativeUrl,
              newName
            )
            props.onInputChanged(props.model.id, { newName }, errorMsg)
          }
          break
        case titleId:
          {
            props.onInputChanged(props.model.id, { newTitle: newValue })
          }
          break
      }
    }, resolveDelay)
  }

  React.useEffect(() => {
    SPDataAdapter.isFilenameValid(props.folderServerRelativeUrl, props.model.name).then(
      (errorMessage) => {
        if (errorMessage) {
          props.onInputChanged(props.model.id, {}, errorMessage)
          setIsExpanded(true)
        }
      }
    )
  }, [props.folderServerRelativeUrl])

  return (
    <div className={styles.documentTemplateItem}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.title}>{props.model.name}</div>
        <div className={styles.icon}>
          <Icon iconName={isExpanded ? 'ChevronDown' : 'ChevronUp'} />
        </div>
      </div>
      <div hidden={!isExpanded}>
        <div className={styles.inputField}>
          <TextField
            id={nameId}
            label={strings.NameLabel}
            placeholder={strings.NameLabel}
            defaultValue={props.model.nameWithoutExtension}
            suffix={`.${props.model.fileExtension}`}
            errorMessage={props.model.errorMessage}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.inputField}>
          <TextField
            id={titleId}
            label={strings.TitleLabel}
            placeholder={strings.TitleLabel}
            defaultValue={props.model.title}
            onChange={onInputChange}
          />
        </div>
      </div>
    </div>
  )
}
