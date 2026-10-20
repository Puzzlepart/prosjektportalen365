import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../context'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'
import { BasePanel, FieldContainer, customLightTheme } from 'pp365-shared-library'
import { FluentProvider, IdPrefixProvider, Input, Textarea } from '@fluentui/react-components'

export const ViewFormPanel: FC = () => {
  const context = usePortfolioAggregationContext()
  const { view, setView, isEditing, onDismiss, onSave, fluentProviderId } = useViewFormPanel()
  return (
    <BasePanel
      open={context.state.viewForm?.isOpen}
      headerText={isEditing ? strings.EditViewHeaderText : strings.NewViewHeaderText}
      footer={<ViewFormPanelFooter onSave={onSave} />}
      onClose={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} className={styles.content}>
          <FieldContainer
            iconName='TextNumberFormat'
            label={strings.TitleLabel}
            description={strings.TitleDescription}
            required={true}
          >
            <Input
              value={view.get('title')}
              onChange={(_, data) => setView('title', data.value)}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='TextAlignLeft'
            label={strings.SearchQueryLabel}
            description={strings.PortfolioAggregationViewSearchQueryDescription}
            required={true}
          >
            <Textarea
              defaultValue={view.get('searchQuery')}
              onChange={(_, data) => setView('searchQuery', data.value)}
              rows={12}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='Icons'
            label={strings.IconNameLabel}
            description={strings.IconNameDescription}
          >
            <Input
              value={view.get('iconName')}
              onChange={(_, data) => setView('iconName', data.value)}
              placeholder={strings.Placeholder.Icon}
            />
          </FieldContainer>
          <FieldContainer
            iconName='GroupList'
            label={strings.DataSourceCategoryLabel}
            description={`${strings.DataSourceCategoryDescription} ${strings.ReadOnlyFromDataSourceText}`}
          >
            {/* Read-only, not disabled: the keyboard reaches it and its value can be read. */}
            <Input value={context.props.dataSourceCategory} readOnly />
          </FieldContainer>
          <FieldContainer
            iconName='GroupList'
            label={strings.DataSourceLevelLabel}
            description={`${strings.DataSourceLevelDescription} ${strings.ReadOnlyFromDataSourceText}`}
          >
            <Input value={context.props.configuration?.level} readOnly />
          </FieldContainer>
        </FluentProvider>
      </IdPrefixProvider>
    </BasePanel>
  )
}

export * from './useViewFormPanel'
