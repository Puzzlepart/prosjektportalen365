import { MessageBarType, Panel, TextField, Toggle } from '@fluentui/react'
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
      <FormFieldContainer>
        <TextField
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
          type='number'
          disabled={isEditing}
          required={true}
          value={view.get('sortOrder')}
          onChange={(_, value) => setView('sortOrder', parseInt(value))}
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
          value={view.get('searchQuery')}
          onChange={(_, value) => setView('searchQuery', value)}
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
      <FormFieldContainer description={strings.DefaultViewDescription}>
        <Toggle
          label={strings.DefaultViewLabel}
          checked={view.get('isDefaultView')}
          onChange={(_, checked) => setView('isDefaultView', checked)}
          disabled={isDefaultViewSet || view.get('isPersonalView')}
        />
        {isDefaultViewSet && (
          <UserMessage text={strings.DefaultViewSetWarningMessage} type={MessageBarType.warning} />
        )}
      </FormFieldContainer>
      <FormFieldContainer description={strings.PersonalViewDescription}>
        <Toggle
          label={strings.PersonalViewLabel}
          checked={view.get('isPersonalView')}
          onChange={(_, checked) => setView('isPersonalView', checked)}
          disabled={view.get('isDefaultView')}
        />
      </FormFieldContainer>
    </Panel>
  )
}

export * from './useViewFormPanel'
