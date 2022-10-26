import { ISearchBoxProps, SearchBox } from '@fluentui/react'
import { ProjectTemplate } from 'models'
import React, { FunctionComponent, useState } from 'react'
import Autocomplete from 'react-autocomplete'
import styles from './TemplateSelector.module.scss'
import { TemplateSelectorItem } from './TemplateSelectorItem'
import { ITemplateSelectorProps } from './types'

export const TemplateSelector: FunctionComponent<ITemplateSelectorProps> = (props) => {
  const [searchValue, setSearchValue] = useState(props.selectedTemplate?.text)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Autocomplete
          getItemValue={(template: ProjectTemplate) => template.text}
          items={props.templates}
          shouldItemRender={(template: ProjectTemplate) =>
            searchValue === props.selectedTemplate.text ||
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
              onClear={(event) => {
                event.stopPropagation()
                event.preventDefault()
                setSearchValue('')
              }}
            />
          )}
          value={searchValue}
          onChange={(_, value) => setSearchValue(value)}
          onSelect={(_, template: ProjectTemplate) => {
            setSearchValue(template.text)
            props.onChange(template)
          }}
          selectOnBlur={true}
        />
      </div>
    </div>
  )
}
