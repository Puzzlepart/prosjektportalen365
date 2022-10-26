import { SearchBox } from '@fluentui/react'
import { ProjectTemplate } from 'models'
import React, { FunctionComponent, useState } from 'react'
import Autocomplete from 'react-autocomplete'
import { omit } from 'underscore'
import styles from './TemplateSelector.module.scss'
import { TemplateSelectorItem } from './TemplateSelectorItem'
import { ITemplateSelectorProps } from './types'

export const TemplateSelector: FunctionComponent<ITemplateSelectorProps> = (props) => {
  const [value, setValue] = useState('')
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
            <TemplateSelectorItem template={template} isHighlighted={isHighlighted} />
          )}
          inputProps={{ className: styles.searchBox }}
          renderInput={(inputProps) => (
            <SearchBox {...omit(inputProps, 'value')} placeholder={inputProps.value} />
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
