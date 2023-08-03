import React, { FC, useEffect, useState } from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { IRenderModeDropdownProps } from './IRenderModeDropdownProps'
import { listOption, tileOption } from './types'
import { ProjectListRenderMode } from '../types'

export const RenderModeDropdown: FC<IRenderModeDropdownProps> = (props) => {
  const options = [tileOption, listOption]
  const [selectedOption, setSelectedOption] = useState<any>(
    props.renderAs === 'tiles' ? tileOption : listOption
  )

  useEffect(
    () => props.onOptionSelect(selectedOption.value as ProjectListRenderMode),
    [selectedOption]
  )

  return (
    <Dropdown
      appearance={'filled-lighter'}
      aria-aria-label={'Render mode dropdown'}
      size={'large'}
      style={{ boxShadow: 'var(--shadow2)', minWidth: '160px' }}
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
