import { ISearchBoxProps, SearchBox } from '@fluentui/react'
import { ProjectTemplate } from 'models'
import React, { FunctionComponent, useState } from 'react'
import Autocomplete from 'react-autocomplete'
import styles from './TemplateSelector.module.scss'
import { TemplateSelectorItem } from './TemplateSelectorItem'
import { ITemplateSelectorProps } from './types'

export const TemplateSelector: FunctionComponent<ITemplateSelectorProps> = (props) => {
  const [value, setValue] = useState(props.selectedTemplate?.text)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Autocomplete
          getItemValue={(template: ProjectTemplate) => template.text}
          items={props.templates}
          shouldItemRender={(template: ProjectTemplate) =>
            template.text.toLowerCase().indexOf(value.toLowerCase()) > -1
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
                // eslint-disable-next-line no-console
                console.log(event.stopPropagation)
                // eslint-disable-next-line no-console
                console.log(event.preventDefault)
                setValue('')
              }}
            />
          )}
          value={value}
          onChange={(_, value_) => setValue(value_)}
          onSelect={(_, template) => props.onChange(template)}
          selectOnBlur={true}
        />
      </div>
    </div>
  )
}
