import React, { FC, useEffect, useState } from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { IRenderModeDropdownProps } from './IRenderModeDropdownProps'
import { listOption, tileOption, compactListOption } from './types'
import { ProjectListRenderMode } from '../types'
import styles from './RenderModeDropdown.module.scss'

export const RenderModeDropdown: FC<IRenderModeDropdownProps> = (props) => {
  const options = [tileOption, listOption, compactListOption]
  const [selectedOption, setSelectedOption] = useState<any>(
    props.renderAs === 'tiles'
      ? tileOption
      : props.renderAs === 'list'
      ? listOption
      : compactListOption
  )

  useEffect(
    () => props.onOptionSelect(selectedOption.value as ProjectListRenderMode),
    [selectedOption]
  )

  return (
    <Dropdown
      className={styles.renderModeDropdown}
      appearance={'filled-lighter'}
      aria-aria-label={'Render mode dropdown'}
      size={'large'}
      defaultValue={selectedOption.text}
      defaultSelectedOptions={[selectedOption.value]}
      onOptionSelect={(_, option) =>
        setSelectedOption(options.filter((o) => o.text === option.optionText)[0])
      }
    >
      {options.map((option) => {
        const Icon = option.icon
        return (
          <Option key={option.value} text={option.text} value={option.value}>
            <Icon />
            <span>{option.text}</span>
          </Option>
        )
      })}
    </Dropdown>
  )
}
