import { IPanelProps, Panel, format } from '@fluentui/react'
import {
  Field,
  FluentProvider,
  Input,
  Switch,
  Textarea,
  webLightTheme
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../../context'
import { Footer } from './Footer'
import styles from './NewRiskActionPanel.module.scss'
import { ResponsibleField } from './ResponsibleField'
import { useNewRiskActionPanel } from './useNewRiskActionPanel'

export const NewRiskActionPanel: FC<IPanelProps> = (props) => {
  const context = useRiskActionFieldCustomizerContext()
  const { model, setModel, onSave, isSaving, fluentProviderId } = useNewRiskActionPanel(props)
  return (
    <Panel
      {...props}
      isLightDismiss={true}
      headerText={format(strings.NewRiskActionPanelTitle, context.itemContext.title)}
      onRenderFooterContent={() => (
        <Footer
          onSave={onSave}
          closePanel={props.onDismiss}
          isSaveDisabled={!model.get('title') || isSaving}
        />
      )}
    >
      <FluentProvider
        id={fluentProviderId}
        className={styles.newRiskActionPanel}
        theme={webLightTheme}
        style={{ background: 'transparent' }}
      >
        <Field label={strings.TitleLabel} required={true}>
          <Input type='text' onChange={(_ev, { value }) => setModel('title', value)} />
        </Field>
        <Field label={strings.DescriptionLabel}>
          <Textarea onChange={(_ev, { value }) => setModel('description', value)} rows={6} />
        </Field>
        <Field label={strings.StartDateLabel}>
          <Input type='date' onChange={(_ev, { value }) => setModel('startDate', value)} />
        </Field>
        <Field label={strings.DueDateLabel}>
          <Input type='date' onChange={(_ev, { value }) => setModel('dueDate', value)} />
        </Field>
        <ResponsibleField onChange={(value) => setModel('responsible', value)} />
        <Field label='Opprett flere'>
          <Switch
            checked={model.get('createMultiple')}
            onChange={(_ev, { checked }) => setModel('createMultiple', checked)}
          />
        </Field>
      </FluentProvider>
    </Panel>
  )
}

NewRiskActionPanel.displayName = 'NewRiskActionPanel'
