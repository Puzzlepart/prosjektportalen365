import { ISearchBoxProps, SearchBox } from '@fluentui/react'
import { ProjectTemplate } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext, useState } from 'react'
import Autocomplete from 'react-autocomplete'
import { TemplateSelectDialogContext } from '../context'
import { ON_TEMPLATE_CHANGED } from '../reducer'
import { TemplateListContentConfigMessage } from '../TemplateListContentConfigMessage'
import { TemplateSelectDialogSectionComponent } from '../types'
import styles from './TemplateSelector.module.scss'
import { TemplateSelectorItem } from './TemplateSelectorItem'

export const TemplateSelector: TemplateSelectDialogSectionComponent = () => {
  const context = useContext(TemplateSelectDialogContext)
  const [searchValue, setSearchValue] = useState(context.state.selectedTemplate?.text)

  /**
   * Sets the selected template to the state, and updates the pre-defined selected extensions
   *
   * @param template - Project template
   */
  const onTemplateChange = (template: ProjectTemplate): void => {
    context.dispatch(ON_TEMPLATE_CHANGED(template))
  }

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
              onClear={(event) => {
                event.stopPropagation()
                event.preventDefault()
                setSearchValue('')
                onTemplateChange(null)
              }}
            />
          )}
          value={searchValue}
          onChange={(_, value) => setSearchValue(value)}
          onSelect={(_, template: ProjectTemplate) => {
            setSearchValue(template.text)
            onTemplateChange(template)
          }}
          selectOnBlur={true}
        />
        {(context.state.selectedTemplate?.listContentConfigIds ||
          context.state.selectedTemplate?.extensionIds) && <TemplateListContentConfigMessage />}
      </div>
    </div>
  )
}
