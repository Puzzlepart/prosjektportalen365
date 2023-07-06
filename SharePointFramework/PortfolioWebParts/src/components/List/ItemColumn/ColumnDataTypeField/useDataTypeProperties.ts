import _ from 'lodash'
import { useEffect, useState } from 'react'
import { IDataTypeFieldsProps } from './DataTypeFields/types'
import { IColumnDataTypeFieldProps, IColumnDataTypePropertyField } from './types'
import { useDataTypeDropdown } from './useDataTypeDropdown'

/**
 * A custom hook that manages the state of the data type properties for a column data type field.
 *
 * @param props - The props for the column data type field.
 * @param selectedOption - The selected option from the data type dropdown.
 *
 * @returns An object containing the data type properties, fields, and visibility state, as well as a function to toggle the visibility state.
 */
export function useDataTypeProperties(
  props: IColumnDataTypeFieldProps,
  { selectedOption }: ReturnType<typeof useDataTypeDropdown>
) {
  const [isFieldsVisible, setIsFieldsVisible] = useState(false)
  const [dataTypeProperties, setDataTypeProperties] = useState<Record<string, any>>({
    ...props.dataTypeProperties
  })
  const [fields, setFields] = useState<IColumnDataTypePropertyField[]>([])

  useEffect(() => {
    if (!selectedOption?.data?.getDataTypeProperties) {
      setFields([])
      return
    }
    setFields(
      selectedOption.data.getDataTypeProperties((key, value) => {
        setDataTypeProperties((prev) => {
          if (value === '' || value === undefined || value === null) return _.omit(prev, key)
          return {
            ...prev,
            [key]: value
          }
        })
      }, dataTypeProperties)
    )
  }, [selectedOption, dataTypeProperties])

  useEffect(() => {
    if (props.onDataTypePropertiesChange) {
      props.onDataTypePropertiesChange(dataTypeProperties)
    }
  }, [dataTypeProperties])

  return {
    dataTypeProperties,
    fields,
    isFieldsVisible,
    toggleIsFieldsVisible: () => setIsFieldsVisible((prev) => !prev)
  } as IDataTypeFieldsProps
}
