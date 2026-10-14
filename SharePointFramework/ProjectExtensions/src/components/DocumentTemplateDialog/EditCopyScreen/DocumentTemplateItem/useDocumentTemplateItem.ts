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
 * count, and the edits, reported once typing pauses with what SharePoint says about a name. The
 * two inputs are told apart by their element id, so the ids are the dispatch keys.
 *
 * @param props The item's props
 */
export function useDocumentTemplateItem(props: IDocumentTemplateItemProps) {
  const { state } = useContext(DocumentTemplateDialogContext)
  const nameId = useId('name')
  const titleId = useId('title')
  const changeTimeout = useRef<ReturnType<typeof setTimeout>>()
  const [isExpanded, setIsExpanded] = useState(false)
  const [nameLength, setNameLength] = useState(
    (props.item.isFolder ? props.item.name : props.item.nameWithoutExtension)?.length || 0
  )
  const [titleLength, setTitleLength] = useState(props.item.title?.length || 0)

  /**
   * Takes a keystroke in either field: the length counts at once, the edit once typing pauses.
   *
   * @param event The change event, whose target's id says which field
   * @param data The new value
   * @param resolveDelay How long typing pauses before the edit is reported, in milliseconds
   */
  function onInputChange(
    event: ChangeEvent<HTMLInputElement>,
    data: { value: string },
    resolveDelay: number = 400
  ) {
    const newValue = data.value
    clearTimeout(changeTimeout.current)
    const targetId = (event.target as HTMLInputElement).id
    if (targetId === nameId) setNameLength(newValue?.length || 0)
    if (targetId === titleId) setTitleLength(newValue?.length || 0)
    changeTimeout.current = setTimeout(async () => {
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
    nameId,
    titleId,
    isExpanded,
    toggleExpanded: () => setIsExpanded(!isExpanded),
    nameLength,
    titleLength,
    onInputChange
  }
}
