import { ChoiceGroup, IChoiceGroupOption, IChoiceGroupOptionStyles } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
import { find } from 'underscore'
import { ProjectTemplate } from '../../../models'
import { ProjectTemplateTooltip } from './ProjectTemplateTooltip'
import styles from './TemplateSelector.module.scss'
import { ITemplateSelectorProps } from './types'

export const TemplateSelector: FunctionComponent<ITemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onChange
}) => {
  const choiceGroupOptionStyles: IChoiceGroupOptionStyles = {
    root: { width: 180, height: 120 },
    choiceFieldWrapper: { width: 180, height: 120 },
    labelWrapper: { maxWidth: '180px !important', width: 120 },
    field: { padding: 0, width: 180, height: 120 }
  }

  const options: IChoiceGroupOption[] = templates.map((t) => ({
    ...t,
    styles: choiceGroupOptionStyles,
    onRenderLabel: (opt: ProjectTemplate) => {
      return (
        <ProjectTemplateTooltip template={opt}>
          <span>{opt.text}</span>
        </ProjectTemplateTooltip>
      )
    }
  }))

  return (
    <div className={styles.root}>
      <ChoiceGroup
        className={styles.choiceGroup}
        disabled={templates?.length <= 1}
        defaultSelectedKey={selectedTemplate.key}
        onChange={(_evt, opt: IChoiceGroupOption) => {
          const template = find(templates, t => t.id === opt.id)
          onChange(template)
        }}
        options={options}
      />
    </div>
  )
}
