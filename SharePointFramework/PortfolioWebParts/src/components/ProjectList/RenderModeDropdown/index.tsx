import { Dropdown, Icon, IDropdownOption, IDropdownProps, IIconProps } from '@fluentui/react'
import React, { FC, useEffect, useState } from 'react'
import styles from './RenderModeDropdown.module.scss'
import { LIST_OPTION, TILE_OPTION } from './types'

export const RenderModeDropdown: FC<Omit<IDropdownProps, 'options'>> = (props) => {
  const [selectedOption, setSelectedOption] = useState<IDropdownOption<IIconProps>>(TILE_OPTION)

  useEffect(() => {
    props.onChange(null, selectedOption)
  }, [selectedOption])

  const onRenderOption = (option: IDropdownOption<IIconProps>): JSX.Element => {
    return (
      <div>
        {option.data?.iconName && (
          <Icon style={{ marginRight: 8 }} iconName={option.data.iconName} />
        )}
        <span>{option.text}</span>
      </div>
    )
  }

  const onRenderTitle = (): JSX.Element => {
    return (
      <div>
        {selectedOption.data?.iconName && (
          <Icon style={{ marginRight: 8 }} iconName={selectedOption.data.iconName} />
        )}
        <span>{selectedOption.text}</span>
      </div>
    )
  }

  return (
    <div className={styles.root} hidden={props.hidden}>
      <Dropdown
        label={null}
        options={[TILE_OPTION, LIST_OPTION]}
        defaultSelectedKey={TILE_OPTION.key}
        onRenderTitle={onRenderTitle}
        onRenderOption={onRenderOption}
        onChange={(_event, option) => setSelectedOption(option)}
      />
    </div>
  )
}
