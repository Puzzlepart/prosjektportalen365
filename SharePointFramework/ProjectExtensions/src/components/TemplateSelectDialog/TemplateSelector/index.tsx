import { ISearchBoxProps, SearchBox } from '@fluentui/react'
import { ProjectTemplate } from 'models'
import React, { FC, useContext, useState } from 'react'
import Autocomplete from 'react-autocomplete'
import { TemplateSelectDialogContext } from '../context'
import styles from './TemplateSelector.module.scss'
import { TemplateSelectorItem } from './TemplateSelectorItem'

export const TemplateSelector: FC = () => {
  const context = useContext(TemplateSelectDialogContext)
  const [searchValue, setSearchValue] = useState(context.state.selectedTemplate?.text)

  /**
   * Sets the selected template to the state, and updates the pre-defined selected extensions
   *
   * @param template - Project template
   */
  const onTemplateChange = (template: ProjectTemplate): void => {
    context.setState({
      selectedTemplate: template,
      selectedExtensions: context.props.data.extensions.filter(
        (ext) => ext.isDefault || template?.listExtensionIds?.some((id) => id === ext.id)
      ),
      selectedListContentConfig: context.props.data.listContentConfig.filter(
        (lcc) => lcc.isDefault || template?.listContentConfigIds?.some((id) => id === lcc.id)
      )
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Autocomplete
          getItemValue={(template: ProjectTemplate) => template.text}
          items={context.props.data.templates.filter((t) => !t.isHidden)}
          shouldItemRender={(template: ProjectTemplate) =>
            searchValue === context.state.selectedTemplate?.text ||
            template.text.toLowerCase().indexOf(searchValue.toLowerCase()) > -1
          }
          renderItem={(template: ProjectTemplate, isHighlighted) => (
            <div key={template.id}>
              <TemplateSelectorItem template={template} isHighlighted={isHighlighted} />
            </div>
          )}
          inputProps={{ className: styles.searchBox }}
          renderInput={(inputProps) => (
            <SearchBox
              {...(inputProps as ISearchBoxProps)}
              iconProps={context.state.selectedTemplate?.iconProps}
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
      </div>
    </div>
  )
}
