import { IPanelProps, Panel, format } from '@fluentui/react'
import { FluentProvider, Input, Switch, Textarea } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { Footer } from './Footer'
import styles from './NewRiskActionPanel.module.scss'
import { ResponsibleField } from './ResponsibleField'
import { useNewRiskActionPanel } from './useNewRiskActionPanel'
import { FieldContainer } from 'pp365-shared-library'
import { useRiskActionFieldCustomizerContext } from '../../../../riskAction/context'

export const NewRiskActionPanel: FC<IPanelProps> = (props) => {
  const context = useRiskActionFieldCustomizerContext()
  const { model, setModel, onSave, isSaving, fluentProviderId } = useNewRiskActionPanel(props)
  return (
    <Panel
      {...props}
      isLightDismiss={true}
      headerText={format(strings.NewRiskActionPanelTitle, context.itemContext.title)}
      isFooterAtBottom={true}
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
        theme={customLightTheme}
        style={{ background: 'transparent' }}
      >
        <FieldContainer label={strings.TitleLabel} required={true} iconName='TextNumberFormat'>
          <Input type='text' onChange={(_ev, { value }) => setModel('title', value)} />
        </FieldContainer>
        <FieldContainer label={strings.DescriptionLabel} iconName='TextAlignLeft'>
          <Textarea onChange={(_ev, { value }) => setModel('description', value)} rows={6} />
        </FieldContainer>
        <FieldContainer label={strings.StartDateLabel} iconName='Calendar'>
          <Input type='date' onChange={(_ev, { value }) => setModel('startDate', value)} />
        </FieldContainer>
        <FieldContainer label={strings.DueDateLabel} iconName='Calendar'>
          <Input type='date' onChange={(_ev, { value }) => setModel('dueDate', value)} />
        </FieldContainer>
        <ResponsibleField onChange={(value) => setModel('responsible', value)} />
        <FieldContainer
          label={strings.CreateMultipleLabel}
          description={strings.CreateMultipleDescription}
          iconName='ToggleLeft'
        >
          <Switch
            checked={model.get('createMultiple')}
            onChange={(_ev, { checked }) => setModel('createMultiple', checked)}
          />
        </FieldContainer>
      </FluentProvider>
    </Panel>
  )
}

NewRiskActionPanel.displayName = 'NewRiskActionPanel'
