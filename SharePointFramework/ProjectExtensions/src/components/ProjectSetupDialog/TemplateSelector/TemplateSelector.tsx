import { Combobox, Divider, Option, Radio, RadioGroup, Text } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { FieldContainer, getFluentIconWithFallback, UserMessage } from 'pp365-shared-library'
import React from 'react'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './TemplateSelector.module.scss'
import { useTemplateSelector } from './useTemplateSelector'

export const TemplateSelector: ProjectSetupDialogSectionComponent = () => {
  const {
    mode,
    hasExistingTemplate,
    matchingTemplates,
    query,
    selectedTemplate,
    isSingleTemplate,
    validationMessage,
    showPlannerWarning,
    onModeChanged,
    onTemplateSelect,
    onClearTemplate,
    setQuery
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
          iconName='ContentView'
          label={strings.ProjectTemplateSelectorTitle}
          description={selectedTemplate?.subText}
        >
          <Combobox
            freeform
            placeholder={strings.ProjectTemplateSelectorSearchPlaceholder}
            disabled={isSingleTemplate}
            value={query || (selectedTemplate?.text ?? '')}
            selectedOptions={selectedTemplate ? [String(selectedTemplate.id)] : []}
            onOptionSelect={onTemplateSelect}
            clearable
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value
              setQuery(value)
              if (value === '') {
                onClearTemplate()
              }
            }}
          >
            {matchingTemplates.length > 0 ? (
              matchingTemplates.map((template) => (
                <Option key={template.id} value={String(template.id)} text={template.text}>
                  <div className={styles.option}>
                    {template.iconProps?.iconName && (
                      <span className={styles.optionIcon}>
                        {getFluentIconWithFallback(template.iconProps.iconName, true)}
                      </span>
                    )}
                    <div className={styles.optionContent}>
                      <Text weight='semibold'>{template.text}</Text>
                      {template.subText && (
                        <Text size={200} wrap>
                          {template.subText}
                        </Text>
                      )}
                    </div>
                  </div>
                </Option>
              ))
            ) : (
              <Option key='no-matches' value='' text='' disabled>
                {strings.ProjectTemplateSelectorNoMatchText}
              </Option>
            )}
          </Combobox>
        </FieldContainer>
      )}
      {showPlannerWarning && (
        <UserMessage text={strings.PlannerMemberWarningMessage} intent='warning' />
      )}
      <Divider>{validationMessage}</Divider>
    </div>
  )
}
