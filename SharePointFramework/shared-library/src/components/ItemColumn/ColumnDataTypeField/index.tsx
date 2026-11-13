import { Dropdown, Option, Switch } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import { getFluentIconWithFallback } from '../../../icons'
import { getDropdownClearButtonProps } from '../../../util/getDropdownClearButtonProps'
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
 * The dropdown and the selected data type's fields. Its hooks read `defaultSelectedKey` and
 * `dataTypeProperties` once, when it mounts.
 */
const ColumnDataTypeFieldContent: FC<IColumnDataTypeFieldProps> = (props) => {
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
          clearButton={getDropdownClearButtonProps()}
        >
          {dropdown.options.map((option) => (
            <Option
              key={option.key}
              value={option.key}
              text={option.text}
              disabled={option.disabled}
            >
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

/**
 * Renders a dropdown field for selecting a column data type, along with additional fields
 * for configuring the selected data type. Also includes an optional switch for persisting
 * the render globally.
 *
 * A new `defaultSelectedKey` starts the field over, from that data type and the
 * `dataTypeProperties` given with it. The column forms get the column they edit after their first
 * render: the field kept the empty start, so the dropdown showed no data type, the type's
 * properties were lost, and saving an edited column stored it as text.
 */
export const ColumnDataTypeField: FC<IColumnDataTypeFieldProps> = (props) => (
  <ColumnDataTypeFieldContent key={props.defaultSelectedKey ?? ''} {...props} />
)

export * from './types'
