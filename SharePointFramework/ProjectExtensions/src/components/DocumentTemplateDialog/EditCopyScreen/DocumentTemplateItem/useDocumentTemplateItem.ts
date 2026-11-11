import { useId } from '@fluentui/react-components'
import { SPDataAdapter } from 'data'
import { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import { DocumentTemplateDialogContext } from '../../context'
import { IDocumentTemplateItemProps } from './types'

/**
 * The most SharePoint allows a file or folder name, and the title.
 */
export const MAX_LENGTH = 255

/**
 * Component logic hook for `DocumentTemplateItem`: whether the fields are shown, the lengths they
 * count, and the edits, reported once typing pauses with what SharePoint says about a name. Each
 * field has its own handler, so the inputs keep the ids their `Field` gives them and a click on a
 * label reaches its input.
 *
 * @param props The item's props
 */
export function useDocumentTemplateItem(props: IDocumentTemplateItemProps) {
  const { state } = useContext(DocumentTemplateDialogContext)
  const fieldsId = useId('copy-fields')
  const changeTimeout = useRef<ReturnType<typeof setTimeout>>()
  const [isExpanded, setIsExpanded] = useState(false)
  const [nameLength, setNameLength] = useState(
    (props.item.isFolder ? props.item.name : props.item.nameWithoutExtension)?.length || 0
  )
  const [titleLength, setTitleLength] = useState(props.item.title?.length || 0)

  /**
   * Takes a keystroke in one of the fields: the length counts at once, the edit once typing pauses.
   *
   * @param field Which field
   * @param data The new value
   * @param resolveDelay How long typing pauses before the edit is reported, in milliseconds
   */
  function onFieldChange(
    field: 'name' | 'title',
    data: { value: string },
    resolveDelay: number = 400
  ) {
    const newValue = data.value
    clearTimeout(changeTimeout.current)
    if (field === 'name') setNameLength(newValue?.length || 0)
    if (field === 'title') setTitleLength(newValue?.length || 0)
    changeTimeout.current = setTimeout(async () => {
      switch (field) {
        case 'name':
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
        case 'title':
          props.onInputChanged(props.item.id, { newTitle: newValue })
          break
      }
    }, resolveDelay)
  }

  // The name as it is may already clash with the target folder; such an item opens to show it.
  useEffect(() => {
    void SPDataAdapter.isFilenameValid(
      state.targetFolder,
      props.item.name,
      props.item.isFolder
    ).then((errorMessage) => {
      props.onInputChanged(props.item.id, {}, errorMessage)
      if (errorMessage) {
        setIsExpanded(true)
      }
    })
  }, [state.targetFolder])

  return {
    fieldsId,
    isExpanded,
    toggleExpanded: () => setIsExpanded(!isExpanded),
    nameLength,
    titleLength,
    onNameChange: (_: ChangeEvent<HTMLInputElement>, data: { value: string }) =>
      onFieldChange('name', data),
    onTitleChange: (_: ChangeEvent<HTMLInputElement>, data: { value: string }) =>
      onFieldChange('title', data)
  }
}
