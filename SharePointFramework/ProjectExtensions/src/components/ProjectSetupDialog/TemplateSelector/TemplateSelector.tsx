import { Combobox, Option, Radio, RadioGroup } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { FieldContainer, UserMessage } from 'pp365-shared-library'
import React from 'react'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './TemplateSelector.module.scss'
import { useTemplateSelector } from './useTemplateSelector'

export const TemplateSelector: ProjectSetupDialogSectionComponent = () => {
  const {
    mode,
    hasExistingTemplate,
    templates,
    selectedTemplate,
    isSingleTemplate,
    validationMessage,
    showPlannerWarning,
    onModeChanged,
    onTemplateSelect,
    onClearTemplate
  } = useTemplateSelector()

  return (
    <div className={styles.root}>
      {hasExistingTemplate && (
        <RadioGroup value={mode} onChange={onModeChanged} layout='horizontal'>
          <Radio value='notemplate' label={strings.ProjectTemplateSelectorNoTemplateRadioLabel} />
          <Radio
            value='selecttemplate'
            label={strings.ProjectTemplateSelectorSelectTemplateRadioLabel}
          />
        </RadioGroup>
      )}
      {mode === 'selecttemplate' && (
        <FieldContainer
          label={strings.ProjectTemplateSelectorTitle}
          validationState={validationMessage ? 'none' : undefined}
          validationMessage={validationMessage}
        >
          <Combobox
            placeholder={strings.ProjectTemplateSelectorSearchPlaceholder}
            disabled={isSingleTemplate}
            value={selectedTemplate?.text ?? ''}
            selectedOptions={selectedTemplate ? [String(selectedTemplate.id)] : []}
            onOptionSelect={onTemplateSelect}
            clearable
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.value === '') {
                onClearTemplate()
              }
            }}
          >
            {templates.map((template) => (
              <Option key={template.id} value={String(template.id)} text={template.text}>
                {template.text}
              </Option>
            ))}
          </Combobox>
        </FieldContainer>
      )}
      {showPlannerWarning && (
        <UserMessage text={strings.PlannerMemberWarningMessage} intent='warning' />
      )}
    </div>
  )
}
