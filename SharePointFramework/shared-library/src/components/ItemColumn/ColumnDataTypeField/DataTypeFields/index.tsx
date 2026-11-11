import { Button, Checkbox, Input, Switch, Textarea } from '@fluentui/react-components'
import _ from 'lodash'
import React, { FC, ReactNode, useEffect, useState } from 'react'
import * as strings from 'SharedLibraryStrings'
import { getFluentIcon } from '../../../../icons'
import { FieldContainer } from '../../../FieldContainer'
import { IColumnDataTypePropertyField, INumberPropertyField, ITextPropertyField } from '../types'
import styles from './DataTypeFields.module.scss'
import { IDataTypeFieldsProps } from './types'

/**
 * The text a text or number field shows. Kept locally so typing accumulates on its own, and
 * re-seeded when the stored value changes from outside. Feeding the stored value straight into
 * the control would make it controlled from the first keystroke, and the stored value only
 * arrives once the caller has processed the change.
 */
function useTextValue(stored: string, onChange: (value: string) => void) {
  const [value, setValue] = useState(stored)
  useEffect(() => setValue(stored), [stored])
  return {
    value,
    onChange: (next: string) => {
      setValue(next)
      onChange(next)
    }
  }
}

const TextPropertyInput: FC<{ field: ITextPropertyField }> = ({ field }) => {
  const text = useTextValue(field.value ?? '', field.onChange)
  return field.multiline ? (
    <Textarea
      value={text.value}
      placeholder={field.placeholder}
      disabled={field.disabled}
      onChange={(_event, data) => text.onChange(data.value)}
    />
  ) : (
    <Input
      value={text.value}
      placeholder={field.placeholder}
      disabled={field.disabled}
      onChange={(_event, data) => text.onChange(data.value)}
    />
  )
}

const NumberPropertyInput: FC<{ field: INumberPropertyField }> = ({ field }) => {
  const stored = field.value === undefined || field.value === null ? '' : String(field.value)
  // An emptied field reports `undefined`, which the caller drops from the stored properties,
  // rather than `NaN`.
  const text = useTextValue(stored, (next) =>
    field.onChange(next === '' ? undefined : parseInt(next, 10))
  )
  return (
    <Input
      type='number'
      value={text.value}
      placeholder={field.placeholder}
      disabled={field.disabled}
      onChange={(_event, data) => text.onChange(data.value)}
    />
  )
}

/**
 * Turns one property description into its control. The only place that knows which Fluent UI
 * control a field kind maps to.
 */
function renderField(field: IColumnDataTypePropertyField): ReactNode {
  switch (field.kind) {
    case 'switch':
      return (
        <Switch
          checked={field.checked ?? false}
          disabled={field.disabled}
          onChange={(_event, data) => field.onChange(data.checked)}
        />
      )
    case 'checkbox':
      return (
        <Checkbox
          checked={field.checked ?? false}
          disabled={field.disabled}
          onChange={(_event, data) => field.onChange(data.checked === true)}
        />
      )
    case 'text':
      return <TextPropertyInput field={field} />
    case 'number':
      return <NumberPropertyInput field={field} />
  }
}

/**
 * Renders the properties of the selected data type as a collapsible list of fields.
 *
 * @param fields - The list of fields to render.
 * @param dataTypeProperties - The data type properties to use for rendering the fields.
 * @param toggleIsFieldsVisible - A function to toggle the visibility of the fields.
 * @param isFieldsVisible - A boolean indicating whether the fields are visible or not.
 */
export const DataTypeFields: FC<IDataTypeFieldsProps> = (props) => {
  const { fields, dataTypeProperties, toggleIsFieldsVisible, isFieldsVisible } = props

  if (_.isEmpty(fields)) {
    return null
  }

  return (
    <div className={styles.root} hidden={!dataTypeProperties}>
      <Button
        appearance='subtle'
        size='medium'
        icon={isFieldsVisible ? getFluentIcon('ChevronUp') : getFluentIcon('ChevronDown')}
        title={
          isFieldsVisible
            ? strings.HideDataTypePropertiesLabel
            : strings.ShowDataTypePropertiesLabel
        }
        onClick={toggleIsFieldsVisible}
      >
        {isFieldsVisible
          ? strings.HideDataTypePropertiesLabel
          : strings.ShowDataTypePropertiesLabel}
      </Button>
      <div className={styles.container} hidden={!isFieldsVisible}>
        {fields.map((field) => (
          <FieldContainer key={field.label} label={field.label} description={field.description}>
            {renderField(field)}
          </FieldContainer>
        ))}
      </div>
    </div>
  )
}
