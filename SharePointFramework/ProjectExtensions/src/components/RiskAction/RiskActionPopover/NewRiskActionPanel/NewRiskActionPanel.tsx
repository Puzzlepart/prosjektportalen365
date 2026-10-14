import { Input, Switch, Textarea } from '@fluentui/react-components'
import { BasePanel, FieldContainer, IBasePanelProps, format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { Footer } from './Footer'
import styles from './NewRiskActionPanel.module.scss'
import { ResponsibleField } from './ResponsibleField'
import { useNewRiskActionPanel } from './useNewRiskActionPanel'
import { useRiskActionFieldCustomizerContext } from '../../../../extensions/riskAction/context'

/**
 * The panel that adds a Planner task to the risk. It renders under `BasePanel`'s provider, so
 * nothing inside it is to add another.
 */
export const NewRiskActionPanel: FC<IBasePanelProps> = (props) => {
  const context = useRiskActionFieldCustomizerContext()
  const { model, setModel, onSave, isSaving } = useNewRiskActionPanel(props)
  return (
    <BasePanel
      {...props}
      isLightDismiss={true}
      headerText={format(strings.NewRiskActionPanelTitle, context.itemContext.title)}
      footer={
        <Footer
          onSave={onSave}
          closePanel={props.onClose}
          isSaveDisabled={!model.get('title') || isSaving}
        />
      }
    >
      <div className={styles.newRiskActionPanel}>
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
      </div>
    </BasePanel>
  )
}

NewRiskActionPanel.displayName = 'NewRiskActionPanel'
