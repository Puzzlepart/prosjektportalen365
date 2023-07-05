import { Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC, createElement, useEffect, useState } from 'react'
import styles from './ColumnRenderField.module.scss'
import { ColumnRenderFieldOption, IColumnRenderFieldProps } from './types'
import { useDataTypeProperties } from './useDataTypeProperties'
import { useRenderAsOptions } from './useRenderAsOptions'

export const ColumnRenderField: FC<IColumnRenderFieldProps> = (props) => {
  const { renderAsOptions, onChange, onRenderOption } = useRenderAsOptions(props)
  const [selectedOption, setSelectedOption] = useState<ColumnRenderFieldOption>(
    _.find(renderAsOptions, (option) => option.key === props.defaultSelectedKey)
  )
  const { dataTypeFields, isDataTypeFieldsVisible, toggleIsDataTypeFieldsVisible } =
    useDataTypeProperties(props, selectedOption)

  useEffect(() => {
    onChange(selectedOption)
  }, [selectedOption])

  return (
    <>
      <FormFieldContainer description={props.description}>
        <Dropdown
          label={strings.ColumnRenderLabel}
          options={renderAsOptions}
          defaultSelectedKey={props.defaultSelectedKey}
          onChange={(_e, option) => setSelectedOption(option)}
          onRenderTitle={(options) => onRenderOption(_.first(options))}
          onRenderOption={onRenderOption}
        />
        {props.children}
      </FormFieldContainer>
      {!_.isEmpty(dataTypeFields) && (
        <div className={styles.dataTypeFields} hidden={!props.dataTypeProperties}>
          <div className={styles.header} onClick={toggleIsDataTypeFieldsVisible}>
            <span className={styles.title}>{strings.ColumnRenderDataTypePropertiesHeaderText}</span>
          </div>
          <div className={styles.container} hidden={!isDataTypeFieldsVisible}>
            {dataTypeFields.map(([component, props]) =>
              createElement(component, {
                ...props,
                key: props.label
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}

ColumnRenderField.defaultProps = {}