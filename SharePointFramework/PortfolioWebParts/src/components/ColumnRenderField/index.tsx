import { Checkbox, Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC } from 'react'
import { DataTypeFields } from './DataTypeFields'
import { IColumnRenderFieldProps } from './types'
import { useDataTypeProperties } from './useDataTypeProperties'
import { useRenderAsOptions } from './useRenderAsOptions'
import styles from './ColumnRenderField.module.scss'

export const ColumnRenderField: FC<IColumnRenderFieldProps> = (props) => {
  const { renderAsOptions, selectedOption, setSelectedOption, onRenderOption } =
    useRenderAsOptions(props)
  const { dataTypeFields, isDataTypeFieldsVisible, toggleIsDataTypeFieldsVisible } =
    useDataTypeProperties(props, selectedOption)

  return (
    <div className={styles.root}>
      <FormFieldContainer description={props.description}>
        <Dropdown
          label={strings.ColumnRenderLabel}
          options={renderAsOptions}
          selectedKey={selectedOption?.key}
          onChange={(_e, option) => setSelectedOption(option)}
          onRenderTitle={(options) => onRenderOption(_.first(options))}
          onRenderOption={onRenderOption}
          disabled={selectedOption.disabled}
        />
        {props.children}
      </FormFieldContainer>
      <DataTypeFields
        dataTypeProperties={props.dataTypeProperties}
        dataTypeFields={dataTypeFields}
        isDataTypeFieldsVisible={isDataTypeFieldsVisible}
        toggleIsDataTypeFieldsVisible={toggleIsDataTypeFieldsVisible}
      />
      {props.persistRenderGloballyField && (
        <FormFieldContainer description={strings.ColumnPersistRenderGloballyFieldDescription}>
          <Checkbox
            {...props.persistRenderGloballyField}
            disabled={props.persistRenderGloballyField.disabled || selectedOption.disabled}
            label={strings.ColumnPersistRenderGloballyFieldLabel}
            styles={{ root: { margin: '10px 0 15px 0' } }}
          />
        </FormFieldContainer>
      )}
    </div>
  )
}

ColumnRenderField.defaultProps = {}