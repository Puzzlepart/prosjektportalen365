import {
  Badge,
  Dropdown,
  Field,
  Option,
  Radio,
  RadioGroup,
  Spinner,
  Text,
  useId
} from '@fluentui/react-components'
import { Cloud16Regular, Cloud24Regular } from '@fluentui/react-icons'
import { ProjectTemplate, getFluentIconWithFallback, UserMessage } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React from 'react'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './TemplateSelector.module.scss'
import { useTemplateSelector } from './useTemplateSelector'

/**
 * A template's icon, name and description, as its card's and its dropdown option's content.
 */
function renderTemplate(template: ProjectTemplate, titleId?: string, descriptionId?: string) {
  return (
    <div className={styles.option}>
      {template.iconProps?.iconName && (
        <span className={styles.optionIcon}>
          {getFluentIconWithFallback(template.iconProps.iconName)}
        </span>
      )}
      <div className={styles.optionContent}>
        <div className={styles.optionTitleRow}>
          <Text weight='semibold' id={titleId}>
            {template.text}
          </Text>
          {template.isCloudTemplate && (
            <Badge appearance='tint' color='brand' size='small' icon={<Cloud16Regular />}>
              {strings.CloudTemplateBadgeText}
            </Badge>
          )}
        </div>
        {template.subText && (
          <Text size={200} id={descriptionId} className={styles.optionDescription}>
            {template.subText}
          </Text>
        )}
      </div>
    </div>
  )
}

/**
 * The template-selection section in the project setup dialog: a few templates as cards, all
 * visible at once, more than that in a dropdown.
 */
export const TemplateSelector: ProjectSetupDialogSectionComponent = () => {
  const {
    choices,
    selectedTemplate,
    selectedValue,
    showAsCards,
    isCloudTemplate,
    isResolvingCloudTemplate,
    cloudTemplateError,
    cloudIncompatibleMessage,
    onTemplateChange
  } = useTemplateSelector()
  const id = useId('template-selector')
  const headingId = `${id}-heading`

  return (
    <div className={styles.root}>
      <h3 id={headingId} className={styles.heading}>
        {strings.ProjectTemplateSelectorTitle}
      </h3>
      {showAsCards ? (
        <RadioGroup
          className={styles.cards}
          value={selectedValue}
          onChange={(_, data) => onTemplateChange(data.value)}
          aria-labelledby={headingId}
        >
          {choices.map((template) => {
            const titleId = `${id}-title-${template.id}`
            const descriptionId = template.subText ? `${id}-description-${template.id}` : undefined
            return (
              <Radio
                key={template.id}
                className={styles.card}
                value={String(template.id)}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                label={{
                  className: styles.cardLabel,
                  children: renderTemplate(template, titleId, descriptionId)
                }}
              />
            )
          })}
        </RadioGroup>
      ) : (
        <Field hint={selectedTemplate?.subText}>
          <Dropdown
            aria-labelledby={headingId}
            placeholder={strings.ProjectTemplateSelectorPlaceholder}
            value={selectedTemplate?.text ?? ''}
            selectedOptions={selectedValue ? [selectedValue] : []}
            onOptionSelect={(_, data) => onTemplateChange(data.optionValue)}
          >
            {choices.map((template) => (
              <Option key={template.id} value={String(template.id)} text={template.text}>
                {renderTemplate(template)}
              </Option>
            ))}
          </Dropdown>
        </Field>
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
    </div>
  )
}
