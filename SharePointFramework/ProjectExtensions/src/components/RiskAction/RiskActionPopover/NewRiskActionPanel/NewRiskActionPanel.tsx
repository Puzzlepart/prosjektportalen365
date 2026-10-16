import { Button, Input, Switch, Textarea } from '@fluentui/react-components'
import {
  BasePanel,
  DateField,
  FieldContainer,
  PeoplePicker,
  UserMessage
} from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './NewRiskActionPanel.module.scss'
import { INewRiskActionPanelProps } from './types'
import { useNewRiskActionPanel } from './useNewRiskActionPanel'

/**
 * The panel that adds a Planner task to the risk: a drawer on `BasePanel`, under whose provider it
 * renders, with the fields the other forms use and save and cancel in the footer.
 */
export const NewRiskActionPanel: FC<INewRiskActionPanelProps> = (props) => {
  const { headerText, form, setField, resolvePeople, onSave, canSave, saveError } =
    useNewRiskActionPanel(props)
  return (
    <BasePanel
      {...props}
      isLightDismiss
      headerText={headerText}
      footer={
        <>
          <Button appearance='primary' onClick={onSave} disabled={!canSave}>
            {strings.SaveButtonLabel}
          </Button>
          <Button appearance='secondary' onClick={props.onClose}>
            {strings.CancelButtonLabel}
          </Button>
        </>
      }
    >
      <div className={styles.newRiskActionPanel}>
        {saveError !== undefined && (
          <UserMessage title={strings.NewRiskActionSaveFailed} text={saveError} intent='error' />
        )}
        <FieldContainer label={strings.TitleLabel} required iconName='TextNumberFormat'>
          <Input value={form.title} onChange={(_event, { value }) => setField('title', value)} />
        </FieldContainer>
        <FieldContainer label={strings.DescriptionLabel} iconName='TextAlignLeft'>
          <Textarea
            value={form.description}
            onChange={(_event, { value }) => setField('description', value)}
            rows={6}
            resize='vertical'
          />
        </FieldContainer>
        <DateField
          label={strings.StartDateLabel}
          value={form.startDate}
          onSelectDate={(date) => setField('startDate', date)}
        />
        <DateField
          label={strings.DueDateLabel}
          value={form.dueDate}
          onSelectDate={(date) => setField('dueDate', date)}
        />
        <FieldContainer label={strings.ResponsibleFieldLabel} iconName='Person'>
          <PeoplePicker
            aria-label={strings.ResponsibleFieldLabel}
            selected={form.responsible}
            onResolveSuggestions={resolvePeople}
            onChange={(people) => setField('responsible', people)}
          />
        </FieldContainer>
        <FieldContainer
          label={strings.CreateMultipleLabel}
          description={strings.CreateMultipleDescription}
          iconName='ToggleLeft'
        >
          <Switch
            checked={form.createMultiple}
            onChange={(_event, { checked }) => setField('createMultiple', checked)}
          />
        </FieldContainer>
      </div>
    </BasePanel>
  )
}

NewRiskActionPanel.displayName = 'NewRiskActionPanel'
