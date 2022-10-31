import { Dropdown, Icon, IDropdownOption, IDropdownProps } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { first } from 'underscore'
import styles from './RenderModeDropdown.module.scss'

export const RenderModeDropdown: FC<Omit<IDropdownProps, 'options'>> = (props) => {
  const onRenderOption = (option: IDropdownOption): JSX.Element => {
    return (
      <div>
        {option.data?.iconName && (
          <Icon style={{ marginRight: 8 }} iconName={option.data.iconName} />
        )}
        <span>{option.text}</span>
      </div>
    )
  }

  const onRenderTitle = (options: IDropdownOption[]): JSX.Element => {
    const option = first(options)

    return (
      <div>
        {option.data?.iconName && (
          <Icon style={{ marginRight: 8 }} iconName={option.data.iconName} />
        )}
        <span>{option.text}</span>
      </div>
    )
  }

  return (
    <div className={styles.root} hidden={props.hidden}>
      <Dropdown
        label={null}
        options={[
          {
            key: 'tiles',
            text: strings.RenderAsTilesText,
            data: { iconName: 'Tiles' }
          },
          {
            key: 'list',
            text: strings.RenderAsListText,
            data: { iconName: 'PageList' }
          }
        ]}
        defaultSelectedKey='tiles'
        onRenderTitle={onRenderTitle}
        onRenderOption={onRenderOption}
        onChange={props.onChange}
      />
    </div>
  )
}
