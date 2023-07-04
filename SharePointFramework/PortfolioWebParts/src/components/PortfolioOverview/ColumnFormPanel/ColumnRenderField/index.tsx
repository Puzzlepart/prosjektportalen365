import { Dropdown, IRenderFunction, ISelectableOption, Icon } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC } from 'react'
import { IColumnRenderFieldProps, renderAsOptions } from './types'

export const ColumnRenderField: FC<IColumnRenderFieldProps> = (props) => {
  /**
   * Render function for dropdown options.
   *
   * @param option Option to render
   */
  const onRenderOption: IRenderFunction<ISelectableOption<any>> = (option) => (
    <div>
      {option.data?.iconProps && (
        <Icon {...option.data.iconProps} styles={{ root: { marginRight: 6 } }} />
      )}
      <span>{option.text}</span>
    </div>
  )

  return (
    <FormFieldContainer description={strings.PortfolioOverviewColumnRenderDescription}>
      <Dropdown
        label={strings.ColumnRenderLabel}
        options={renderAsOptions}
        defaultSelectedKey={props.defaultSelectedKey}
        onChange={(_e, option) => {
          const value = _.capitalize(option.key as string)
            .split('_')
            .join(' ')
          props.onChange(value)
        }}
        onRenderTitle={(options) => onRenderOption(_.first(options))}
        onRenderOption={onRenderOption}
      />
    </FormFieldContainer>
  )
}
