import { Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { DataTypeFields } from './DataTypeFields'
import { IColumnDataTypeFieldProps } from './types'
import { useDataTypeDropdown } from './useDataTypeDropdown'
import { useDataTypeProperties } from './useDataTypeProperties'
import { FieldContainer } from 'pp365-shared-library'
import { Switch } from '@fluentui/react-components'
import styles from './ColumnRenderField.module.scss'

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
    <div className={styles.root}>
      <FieldContainer
        className={styles.root}
        iconName='AppsList'
        label={props.label}
        description={props.description}
      >
        {/* TODO: Use new Dropdown/ComboBox from Fluent UI 9 */}
        <Dropdown {...dataTypeDropdown} />
        {props.children}
        <DataTypeFields {...dataTypeFields} />
      </FieldContainer>
      {props.persistRenderGloballyField && (
        <FieldContainer
          iconName='AppsList'
          label={strings.ColumnPersistRenderGloballyFieldLabel}
          description={strings.ColumnPersistRenderGloballyFieldDescription}
        >
          <Switch
            {...props.persistRenderGloballyField}
            disabled={
              props.persistRenderGloballyField.disabled ||
              dataTypeDropdown?.selectedOption?.disabled
            }
          />
        </FieldContainer>
      )}
    </div>
  )
}

ColumnDataTypeField.defaultProps = {}

export * from './types'
