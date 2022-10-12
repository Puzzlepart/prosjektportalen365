import { ChoiceGroup, IChoiceGroupOptionStyles } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
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
    root: { width: 180, height: 140 },
    choiceFieldWrapper: { width: 180, height: 140 },
    labelWrapper: { maxWidth: '180px !important', width: 180 },
    field: { padding: 0, width: 180, height: 140 }
  }

  return (
    <div className={styles.root}>
      <ChoiceGroup
        className={styles.choiceGroup}
        disabled={templates?.length <= 1}
        defaultSelectedKey={selectedTemplate.key}
        onChanged={(opt: ProjectTemplate) => onChange(opt)}
        options={templates.map((t) => ({
          ...t,
          styles: choiceGroupOptionStyles,
          onRenderLabel: (opt: ProjectTemplate) => {
            return (
              <ProjectTemplateTooltip template={opt}>
                <span>{opt.text}</span>
              </ProjectTemplateTooltip>
            )
          }
        }))}
      />
    </div>
  )
}
