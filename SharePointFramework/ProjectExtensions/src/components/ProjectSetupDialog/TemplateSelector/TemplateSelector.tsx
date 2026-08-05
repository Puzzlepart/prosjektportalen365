import {
  Badge,
  Combobox,
  Option,
  Radio,
  RadioGroup,
  Spinner,
  Text
} from '@fluentui/react-components'
import { Cloud16Regular, Cloud24Regular } from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import { FieldContainer, getFluentIconWithFallback, UserMessage } from 'pp365-shared-library'
import React from 'react'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './TemplateSelector.module.scss'
import { useTemplateSelector } from './useTemplateSelector'

/** Renders the template-selection section in the project setup dialog. */
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
    isCloudTemplate,
    isResolvingCloudTemplate,
    cloudTemplateError,
    cloudIncompatibleMessage,
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
                      <div className={styles.optionTitleRow}>
                        <Text weight='semibold'>{template.text}</Text>
                        {template.isCloudTemplate && (
                          <Badge
                            appearance='tint'
                            color='brand'
                            size='small'
                            icon={<Cloud16Regular />}
                          >
                            {strings.CloudTemplateBadgeText}
                          </Badge>
                        )}
                      </div>
                      {template.subText && (
                        <Text
                          size={200}
                          className={styles.optionDescription}
                          title={template.subText}
                        >
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
      {isCloudTemplate && !cloudTemplateError && (
        <div className={styles.cloudBanner}>
          <div className={styles.cloudBannerIcon}>
            <Cloud24Regular />
          </div>
          <div className={styles.cloudBannerContent}>
            <div className={styles.cloudBannerHeader}>
              <Text weight='semibold'>{selectedTemplate?.text}</Text>
              <Badge appearance='filled' color='brand' icon={<Cloud16Regular />}>
                {strings.CloudTemplateBadgeText}
              </Badge>
            </div>
            <Text size={200}>{strings.CloudTemplateBannerText}</Text>
          </div>
        </div>
      )}
      {cloudIncompatibleMessage && <UserMessage text={cloudIncompatibleMessage} intent='warning' />}
      {isResolvingCloudTemplate && (
        <Spinner size='tiny' label={strings.CloudTemplateResolvingMessage} />
      )}
      {cloudTemplateError && <UserMessage text={cloudTemplateError} intent='error' />}
      {validationMessage && <UserMessage text={validationMessage} intent='info' />}
    </div>
  )
}
