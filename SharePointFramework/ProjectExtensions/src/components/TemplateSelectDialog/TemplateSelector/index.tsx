import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import * as React from 'react'
import { ProjectTemplate } from '../../../models'
import { ITemplateSelectorProps } from './types'
import styles from './TemplateSelector.module.scss'

export const TemplateSelector: React.FunctionComponent<ITemplateSelectorProps> = (props) => {
  /**
   * On template selected
   *
   * @param opt Option
   */
  const onTemplateSelected = (opt: ProjectTemplate): void => {
    props.onChange(opt)
  }

  /**
   * On render option
   *
   * @param opt Option
   */
  const onRenderOption = (option: ProjectTemplate): JSX.Element => {
    return (
      <div className={styles.dropdownOption}>
        <div className={styles.icon}>
          <Icon iconName={option.iconName} />
        </div>
        <div className={styles.body}>
          <div className={styles.text}>{option.text}</div>
          <div className={styles.subText}>{option.subText}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.templateSelector}>
      <div className={styles.dropdown}>
        <Dropdown
          disabled={props.templates?.length <= 1}
          defaultSelectedKey={props.selectedTemplate.key}
          onChanged={onTemplateSelected}
          options={props.templates}
          onRenderOption={onRenderOption}
        />
      </div>
    </div>
  )
}
