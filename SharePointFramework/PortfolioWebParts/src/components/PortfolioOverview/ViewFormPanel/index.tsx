import { Panel, Slider, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { FormFieldContainer, UserMessage } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'

export const ViewFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const { view, setView, isEditing, onDismiss, isDefaultViewSet, onSave } = useViewFormPanel()
  return (
    <Panel
      isOpen={context.state.viewForm.isOpen}
      headerText={isEditing ? strings.EditViewHeaderText : strings.NewViewHeaderText}
      onRenderFooterContent={() => <ViewFormPanelFooter onSave={onSave} />}
      isFooterAtBottom={true}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <FormFieldContainer description={strings.SortOrderDescription}>
        <Slider
          label={strings.SortOrderLabel}
          defaultValue={view.get('sortOrder')}
          onChanged={(_, value) => setView('sortOrder', value)}
          showValue={true}
          min={10}
          max={100}
          step={1}
          disabled={view.get('isDefaultView')}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.TitleLabel}
          required={true}
          value={view.get('title')}
          onChange={(_, value) => setView('title', value)}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.SearchQueryLabel}
          description={strings.PortfolioViewSearchQueryDescription}
          required={true}
          multiline={true}
          rows={12}
          defaultValue={view.get('searchQuery')}
          onBlur={(event) => setView('searchQuery', event.target.value)}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.IconNameLabel}
          description={strings.IconNameDescription}
          required={true}
          value={view.get('iconName')}
          onChange={(_, value) => setView('iconName', value)}
          iconProps={{ iconName: view.get('iconName') }}
        />
      </FormFieldContainer>
      <FormFieldContainer
        description={strings.DefaultViewDescription}
        hidden={view.get('isPersonalView')}
      >
        <Toggle
          label={strings.DefaultViewLabel}
          checked={view.get('isDefaultView')}
          onChange={(_, checked) => setView('isDefaultView', checked)}
          disabled={isDefaultViewSet}
        />
        {isDefaultViewSet && (
          <UserMessage text={strings.DefaultViewSetWarningMessage} intent='warning' />
        )}
      </FormFieldContainer>
      <FormFieldContainer
        description={strings.PersonalViewDescription}
        hidden={view.get('isDefaultView')}
      >
        <Toggle
          label={strings.PersonalViewLabel}
          checked={view.get('isPersonalView')}
          onChange={(_, checked) => setView('isPersonalView', checked)}
        />
      </FormFieldContainer>
    </Panel>
  )
}

export * from './useViewFormPanel'
