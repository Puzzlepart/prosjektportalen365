import { Autocomplete, FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../../context'
import { IColumnSearchPropertyFieldProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { TextField } from '@fluentui/react'
import _ from 'lodash'

export const ColumnSearchPropertyField: FC<IColumnSearchPropertyFieldProps> = (props) => {
  const context = useContext(PortfolioOverviewContext)
  const { managedProperties } = context.state
  return (
    <FormFieldContainer description={strings.SearchPropertyDescription}>
      {_.isEmpty(managedProperties) ? (
        <TextField
          label={strings.SearchPropertyLabel}
          description={strings.SearchPropertyDescription}
          required={true}
          value={props.value}
          disabled={props.disabled}
          onChange={(_, value) => props.onChange(value)}
        />
      ) : (
        <Autocomplete
          label={strings.SearchPropertyLabel}
          placeholder={strings.SearchPropertyPlaceholder}
          defaultSelectedKey={props.value}
          disabled={props.disabled}
          iconProps={{
            iconName: 'SearchData'
          }}
          items={managedProperties}
          onSelected={(item) => props.onChange(item.key.toString())}
        />
      )}
      {props.children}
    </FormFieldContainer>
  )
}
