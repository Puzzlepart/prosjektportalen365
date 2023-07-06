import { Panel, TextField } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'
import { PortfolioAggregationContext } from '../context'

export const ViewFormPanel: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const { view, setView, isEditing, onDismiss, onSave } = useViewFormPanel()
  return (
    <Panel
      isOpen={context.state.viewForm?.isOpen}
      headerText={isEditing ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      onRenderFooterContent={() => <ViewFormPanelFooter onSave={onSave} />}
      isFooterAtBottom={true}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
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
          description={strings.PortfolioAggregationViewSearchQueryDescription}
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
      <FormFieldContainer>
        <TextField
          label={strings.DataSourceCategoryLabel}
          description={strings.DataSourceCategoryDescription}
          disabled={true}
          value={context.props.dataSourceCategory}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.DataSourceLevelLabel}
          description={strings.DataSourceLevelDescription}
          disabled={true}
          value={context.props.configuration?.level}
        />
      </FormFieldContainer>
    </Panel>
  )
}

export * from './useViewFormPanel'
