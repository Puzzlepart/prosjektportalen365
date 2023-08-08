import { Checkbox, Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC } from 'react'
import { DataTypeFields } from './DataTypeFields'
import { IColumnDataTypeFieldProps } from './types'
import { useDataTypeDropdown } from './useDataTypeDropdown'
import { useDataTypeProperties } from './useDataTypeProperties'

/**
 * Renders a dropdown field for selecting a column data type, along with additional fields
 * for configuring the selected data type. Also includes an optional checkbox for persisting
 * the render globally.
 *
 * @param props - The component props.
 * @param props.description - The description to display above the dropdown field.
 * @param props.persistRenderGloballyField - The checkbox field for persisting the render globally.
 * @param props.children - Additional child components to render.
 *
 * @returns The rendered component.
 */
export const ColumnDataTypeField: FC<IColumnDataTypeFieldProps> = (props) => {
  const dataTypeDropdown = useDataTypeDropdown(props)
  const dataTypeFields = useDataTypeProperties(props, dataTypeDropdown)

  return (
    <div>
      <FormFieldContainer description={props.description}>
        <Dropdown {...dataTypeDropdown} />
        {props.children}
      </FormFieldContainer>
      <DataTypeFields {...dataTypeFields} />
      {props.persistRenderGloballyField && (
        <FormFieldContainer description={strings.ColumnPersistRenderGloballyFieldDescription}>
          <Checkbox
            {...props.persistRenderGloballyField}
            disabled={
              props.persistRenderGloballyField.disabled ||
              dataTypeDropdown?.selectedOption?.disabled
            }
            label={strings.ColumnPersistRenderGloballyFieldLabel}
            styles={{ root: { margin: '10px 0 15px 0' } }}
          />
        </FormFieldContainer>
      )}
    </div>
  )
}

ColumnDataTypeField.defaultProps = {}

export * from './types'
