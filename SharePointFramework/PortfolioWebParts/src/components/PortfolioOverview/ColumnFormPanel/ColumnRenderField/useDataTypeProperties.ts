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
  const [fields, setFields] = useState<ColumnRenderFieldOptionAdditionalField[]>([])

  useEffect(() => {
    if (selectedOption?.data?.getDataTypeProperties) {
      setFields(
        selectedOption.data.getDataTypeProperties((key: string, value: any) => {
          setDataTypeProperties((prev) => ({ ...prev, [key]: value }))
        }, dataTypeProperties)
      )
    }
  }, [selectedOption, dataTypeProperties])

  useEffect(() => {
    props.onDataTypePropertiesChange(dataTypeProperties)
  }, [dataTypeProperties])

  return {
    fields,
    isDataTypeFieldsVisible,
    toggleIsDataTypeFieldsVisible: () => setIsDataTypeFieldsVisible((prev) => !prev)
  } as const
}
