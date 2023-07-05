import _ from 'lodash'
import { useEffect, useState } from 'react'
import {
  ColumnRenderFieldOption,
  ColumnRenderFieldOptionAdditionalField,
  IColumnRenderFieldProps
} from './types'

export function useDataTypeProperties(
  props: IColumnRenderFieldProps,
  selectedOption: ColumnRenderFieldOption
) {
  const [isDataTypeFieldsVisible, setIsDataTypeFieldsVisible] = useState<boolean>(false)
  const [dataTypeProperties, setDataTypeProperties] = useState<Record<string, any>>({
    ...props.dataTypeProperties
  })
  const [dataTypeFields, setDataTypeFields] = useState<ColumnRenderFieldOptionAdditionalField[]>([])

  useEffect(() => {
    if (!selectedOption?.data?.getDataTypeProperties) {
      setDataTypeFields([])
      return
    }
    setDataTypeFields(
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
    dataTypeFields,
    isDataTypeFieldsVisible,
    toggleIsDataTypeFieldsVisible: () => setIsDataTypeFieldsVisible((prev) => !prev)
  } as const
}
