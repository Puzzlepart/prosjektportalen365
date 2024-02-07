import { ISearchBoxProps, SearchBox } from '@fluentui/react'
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

export const TemplateSelector: ProjectSetupDialogSectionComponent = () => {
  const context = useProjectSetupDialogContext()
  const [searchValue, setSearchValue] = useState(context.state.selectedTemplate?.text)

  return (
    <div className={styles.root}>
      <div className={styles.container}>
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
      </div>
    </div>
  )
}
