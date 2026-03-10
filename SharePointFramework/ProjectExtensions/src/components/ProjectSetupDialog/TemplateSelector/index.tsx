import { ChoiceGroup, IChoiceGroupOption, ISearchBoxProps, SearchBox } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import { ProjectTemplate } from 'pp365-shared-library'
import React, { useState } from 'react'
import Autocomplete from 'react-autocomplete'
import { TemplateConfigMessage } from '../TemplateConfigMessage'
import { useProjectSetupDialogContext } from '../context'
import { ON_TEMPLATE_CHANGED } from '../reducer'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './TemplateSelector.module.scss'
import { TemplateSelectorItem } from './TemplateSelectorItem'
import { createNoTemplateOption } from '../../../extensions/projectSetup/noTemplate'

type TemplateSelectorMode = 'notemplate' | 'selecttemplate'

export const TemplateSelector: ProjectSetupDialogSectionComponent = () => {
  const context = useProjectSetupDialogContext()
  const hasExistingTemplate = context.props.data.hasExistingTemplate

  const initialMode: TemplateSelectorMode = hasExistingTemplate ? 'notemplate' : 'selecttemplate'
  const [mode, setMode] = useState<TemplateSelectorMode>(initialMode)

  const defaultTemplate = (() => {
    const [def] = context.props.data.templates.filter((t) => t.isDefault)
    return def || context.props.data.templates[0]
  })()

  const [searchValue, setSearchValue] = useState(
    hasExistingTemplate ? defaultTemplate?.text ?? '' : context.state.selectedTemplate?.text ?? ''
  )

  const options: IChoiceGroupOption[] = [
    {
      key: 'notemplate',
      text: strings.NoTemplateRadioLabel,
      disabled: !hasExistingTemplate,
      onRenderLabel: (props) => (
        <span className={styles.radioLabelContainer}>
          <span className={styles.radioLabel}>{props.text}</span>
          <span className={styles.radioDescription}>{strings.NoTemplateDescription}</span>
        </span>
      )
    },
    {
      key: 'selecttemplate',
      text: strings.SelectTemplateRadioLabel
    }
  ]

  const onModeChanged = (_: any, option: IChoiceGroupOption) => {
    const newMode = option.key as TemplateSelectorMode
    setMode(newMode)
    if (newMode === 'notemplate') {
      context.dispatch(ON_TEMPLATE_CHANGED(createNoTemplateOption()))
    } else {
      const template = defaultTemplate
      if (template) {
        setSearchValue(template.text)
        context.dispatch(ON_TEMPLATE_CHANGED(template))
      }
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <ChoiceGroup selectedKey={mode} options={options} onChange={onModeChanged} />
        {mode === 'selecttemplate' && (
          <>
            <Autocomplete
              getItemValue={(template: ProjectTemplate) => template.text}
              items={context.props.data.templates.filter((t) => !t.hidden)}
              shouldItemRender={(template: ProjectTemplate) =>
                searchValue === context.state.selectedTemplate?.text ||
                template.text.toLowerCase().indexOf(searchValue.toLowerCase()) > -1
              }
              renderItem={(template: ProjectTemplate, isHighlighted) => (
                <div key={template.id}>
                  <TemplateSelectorItem template={template} isHighlighted={isHighlighted} />
                </div>
              )}
              inputProps={{
                className: styles.searchBox,
                placeholder: strings.TemplateSelectorSearchPlaceholder
              }}
              renderInput={(inputProps) => (
                <SearchBox
                  {...(inputProps as ISearchBoxProps)}
                  iconProps={context.state.selectedTemplate?.iconProps}
                  clearButtonProps={{ title: strings.TemplateSelectorSearchClearText }}
                  disabled={context.props.data.templates.length === 1}
                  onClear={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    setSearchValue('')
                    context.dispatch(ON_TEMPLATE_CHANGED(null))
                  }}
                />
              )}
              value={searchValue}
              onChange={(_, value) => setSearchValue(value)}
              onSelect={(_, template: ProjectTemplate) => {
                setSearchValue(template.text)
                context.dispatch(ON_TEMPLATE_CHANGED(template))
              }}
              selectOnBlur={true}
            />
            <TemplateConfigMessage section='TemplateSelector' />
          </>
        )}
      </div>
    </div>
  )
}
