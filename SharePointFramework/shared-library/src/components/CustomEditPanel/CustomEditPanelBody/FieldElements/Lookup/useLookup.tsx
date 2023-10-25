import { OptionProps } from '@fluentui/react-components'
import { useEffect, useState } from 'react'
import { EditableSPField } from '../../../../../models'
import { useCustomEditPanelContext } from '../../../context'

export function useLookup(field: EditableSPField) {
  const context = useCustomEditPanelContext()
  const [options, setOptions] = useState<OptionProps[]>([])
  const [defaultValue, setDefaultValue] = useState<string>()
  useEffect(() => {
    context.props.targetWeb.lists
      .getById(field.LookupList)
      .items.select('Id', field.LookupField)
      .getAll()
      .then((items) => {
        const _options = items.map((item) => ({
          key: item.Id,
          value: item.Id,
          text: item[field.LookupField]
        }))
        setOptions(_options)
        const selectedOption = _options.find(
          (option) => option.text === context.model.get(field, {})[field.LookupField]
        )?.value
        console.log(
          _options,
          selectedOption,
          context.model.get(field, {}),
          context.model.get(field, {})[field.LookupField]
        )
        setDefaultValue(selectedOption)
      })
  }, [])

  return { options, defaultValue }
}
