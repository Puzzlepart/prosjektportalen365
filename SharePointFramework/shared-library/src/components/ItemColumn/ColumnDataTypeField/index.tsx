import { Dropdown, Option, Switch } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import { getFluentIconWithFallback } from '../../../icons'
import { FieldContainer } from '../../FieldContainer'
import styles from './ColumnRenderField.module.scss'
import { DataTypeFields } from './DataTypeFields'
import { IColumnDataTypeFieldOption, IColumnDataTypeFieldProps } from './types'
import { useDataTypeDropdown } from './useDataTypeDropdown'
import { useDataTypeProperties } from './useDataTypeProperties'

/**
 * An option's icon and text, as shown both in the list and on the closed dropdown.
 */
const OptionContent: FC<{ option: IColumnDataTypeFieldOption }> = ({ option }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    {getFluentIconWithFallback(option.data?.iconProps?.iconName)}
    <span>{option.text}</span>
  </span>
)

/**
 * Renders a dropdown field for selecting a column data type, along with additional fields
 * for configuring the selected data type. Also includes an optional switch for persisting
 * the render globally.
 *
 * @param props - The component props.
 * @param props.description - The description to display above the dropdown field.
 * @param props.persistRenderGloballyField - The switch field for persisting the render globally.
 * @param props.children - Additional child components to render.
 */
export const ColumnDataTypeField: FC<IColumnDataTypeFieldProps> = (props) => {
  const dropdown = useDataTypeDropdown(props)
  const dataTypeFields = useDataTypeProperties(props, dropdown)
  const { selectedOption } = dropdown

  return (
    <div className={styles.root}>
      <FieldContainer
        className={styles.root}
        iconName='AppsList'
        label={props.label}
        description={props.description}
      >
        <Dropdown
          value={selectedOption?.text ?? ''}
          selectedOptions={selectedOption ? [selectedOption.key] : []}
          onOptionSelect={dropdown.onOptionSelect}
          disabled={dropdown.disabled}
          button={selectedOption ? <OptionContent option={selectedOption} /> : undefined}
        >
          {dropdown.options.map((option) => (
            <Option key={option.key} value={option.key} text={option.text} disabled={option.disabled}>
              <OptionContent option={option} />
            </Option>
          ))}
        </Dropdown>
        {props.children}
        <DataTypeFields {...dataTypeFields} />
      </FieldContainer>
      {props.persistRenderGloballyField && !props.persistRenderGloballyField.hidden && (
        <FieldContainer
          iconName='AppsList'
          label={strings.ColumnPersistRenderGloballyFieldLabel}
          description={strings.ColumnPersistRenderGloballyFieldDescription}
        >
          <Switch {...props.persistRenderGloballyField} disabled={dropdown.disabled} />
        </FieldContainer>
      )}
    </div>
  )
}

ColumnDataTypeField.defaultProps = {}

export * from './types'
