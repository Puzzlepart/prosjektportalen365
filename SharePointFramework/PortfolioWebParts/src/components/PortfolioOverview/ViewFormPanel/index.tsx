import { Panel, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'

export const ViewFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const { view, setView, isEditing, onDismiss, isSaveDisabled } = useViewFormPanel()
  return (
    <Panel
      isOpen={context.state.viewForm.isOpen}
      headerText={isEditing ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      onRenderFooterContent={() => <ViewFormPanelFooter isSaveDisabled={isSaveDisabled} />}
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
        />
      </FormFieldContainer>
      <FormFieldContainer description={strings.DefaultViewDescription}>
        <Toggle
          label={strings.DefaultViewLabel}
          checked={view.get('isDefault')}
          onChange={(_, checked) => setView('isDefault', checked)}
        />
      </FormFieldContainer>
      <FormFieldContainer description={strings.PersonalViewDescription}>
        <Toggle
          label={strings.PersonalViewLabel}
          checked={view.get('isPersonal')}
          onChange={(_, checked) => setView('isPersonal', checked)}
        />
      </FormFieldContainer>
    </Panel>
  )
}

export * from './useViewFormPanel'
