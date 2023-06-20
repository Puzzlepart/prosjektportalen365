import { Dropdown, Icon, IRenderFunction } from '@fluentui/react'
import React, { FC, useEffect, useState } from 'react'
import { ProjectListRenderMode } from '../types'
import styles from './RenderModeDropdown.module.scss'
import {
  IRenderModeDropdownProps,
  LIST_OPTION,
  RenderModeDropdownOption,
  TILE_OPTION
} from './types'

export const RenderModeDropdown: FC<IRenderModeDropdownProps> = (props) => {
  const [selectedOption, setSelectedOption] = useState<RenderModeDropdownOption>(
    props.renderAs === 'tiles' ? TILE_OPTION : LIST_OPTION
  )

  useEffect(() => props.onChange(selectedOption.key as ProjectListRenderMode), [selectedOption])

  const onRenderOption: IRenderFunction<RenderModeDropdownOption> = (option) => {
    return (
      <div>
        {option.data?.iconProps && <Icon style={{ marginRight: 8 }} {...option.data.iconProps} />}
        <span>{option.text}</span>
      </div>
    )
  }

  const onRenderTitle: IRenderFunction<RenderModeDropdownOption[]> = () =>
    onRenderOption(selectedOption)

  return (
    <div className={styles.root} hidden={props.hidden}>
      <Dropdown
        options={[TILE_OPTION, LIST_OPTION]}
        selectedKey={selectedOption.key}
        onRenderTitle={onRenderTitle}
        onRenderOption={onRenderOption}
        onChange={(_event, option) => setSelectedOption(option)}
      />
    </div>
  )
}
