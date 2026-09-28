import { Dropdown } from '@fluentui/react'
import { Switch } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import { FieldContainer } from '../../FieldContainer'
import styles from './ColumnRenderField.module.scss'
import { DataTypeFields } from './DataTypeFields'
import { IColumnDataTypeFieldProps } from './types'
import { useDataTypeDropdown } from './useDataTypeDropdown'
import { useDataTypeProperties } from './useDataTypeProperties'

/**
 * Renders a dropdown field for selecting a column data type, along with additional fields
 * for configuring the selected data type. Also includes an optional switch for persisting
 * the render globally.
 *
 * The dropdown is still Fluent UI v8; see `useDataTypeDropdown` for why. The property fields
 * under it are v9.
 *
 * @param props - The component props.
 * @param props.description - The description to display above the dropdown field.
 * @param props.persistRenderGloballyField - The switch field for persisting the render globally.
 * @param props.children - Additional child components to render.
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
        <Dropdown {...dataTypeDropdown} />
        {props.children}
        <DataTypeFields {...dataTypeFields} />
      </FieldContainer>
      {props.persistRenderGloballyField && !props.persistRenderGloballyField.hidden && (
        <FieldContainer
          iconName='AppsList'
          label={strings.ColumnPersistRenderGloballyFieldLabel}
          description={strings.ColumnPersistRenderGloballyFieldDescription}
        >
          <Switch
            {...props.persistRenderGloballyField}
            disabled={dataTypeDropdown?.selectedOption?.disabled}
          />
        </FieldContainer>
      )}
    </div>
  )
}

ColumnDataTypeField.defaultProps = {}

export * from './types'
