import { Dropdown, IRenderFunction, Icon } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC, createElement, useEffect, useState } from 'react'
import { ColumnRenderFieldOption, IColumnRenderFieldProps, renderAsOptions } from './types'
import styles from './ColumnRenderField.module.scss'
import { useDataTypeProperties } from './useDataTypeProperties'

export const ColumnRenderField: FC<IColumnRenderFieldProps> = (props) => {
  const [selectedOption, setSelectedOption] = useState<ColumnRenderFieldOption>(
    _.find(renderAsOptions, (option) => option.key === props.defaultSelectedKey)
  )
  const { dataTypeFields, isDataTypeFieldsVisible, toggleIsDataTypeFieldsVisible } =
    useDataTypeProperties(props, selectedOption)

  /**
   * Render function for dropdown options.
   *
   * @param option Option to render
   */
  const onRenderOption: IRenderFunction<ColumnRenderFieldOption> = (option) => (
    <div>
      {option.data?.iconProps && (
        <Icon {...option.data.iconProps} styles={{ root: { marginRight: 6 } }} />
      )}
      <span>{option.text}</span>
    </div>
  )

  useEffect(() => {
    if (!selectedOption) return
    const value =
      selectedOption.id ??
      _.capitalize(selectedOption.key as string)
        .split('_')
        .join(' ')
    props.onChange(value)
  }, [selectedOption])

  return (
    <>
      <FormFieldContainer description={strings.PortfolioOverviewColumnRenderDescription}>
        <Dropdown
          label={strings.ColumnRenderLabel}
          options={renderAsOptions}
          defaultSelectedKey={props.defaultSelectedKey}
          onChange={(_e, option) => setSelectedOption(option)}
          onRenderTitle={(options) => onRenderOption(_.first(options))}
          onRenderOption={onRenderOption}
        />
      </FormFieldContainer>
      {!_.isEmpty(dataTypeFields) && (
        <div className={styles.dataTypeFields}>
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
