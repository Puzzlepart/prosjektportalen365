import { OptionProps } from '@fluentui/react-components'
import { useEffect, useMemo, useState } from 'react'
import { EditableSPField } from '../../../../../models'
import { useCustomEditPanelContext } from '../../../context'
import { get } from 'lodash'
import strings from 'SharedLibraryStrings'

export function useLookup(field: EditableSPField) {
  const context = useCustomEditPanelContext()
  const [options, setOptions] = useState<OptionProps[]>([])
  useEffect(() => {
    context.props.targetWeb.lists
      .getById(field.LookupList)
      .items.select('Id', field.LookupField)
      .getAll()
      .then((items) => {
        setOptions(
          items
            .map((item) => ({
              key: item.Id,
              value: item.Id,
              text: item[field.LookupField]
            }))
            .filter((item) => {
              if (field.InternalName === 'GtTimelineTypeLookup') {
                return item.text !== strings.ProjectLabel && item.text !== strings.ProjectDeliveryLabel
              }
              return true
            })
        )
      })
  }, [])

  const value = useMemo(() => {
    const selectedOption = options.find((option) => {
      const fieldValue = context.model.get(field)
      return option.text === get(fieldValue, [field.LookupField]) || option.value === fieldValue
    })
    return selectedOption ?? { text: null, value: null }
  }, [options, context.model.get(field)])

  return { options, value }
}
