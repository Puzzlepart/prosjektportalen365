import { Panel } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../context'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'
import { FieldContainer, customLightTheme } from 'pp365-shared-library'
import {
  FluentProvider,
  IdPrefixProvider,
  Input,
  Textarea,
  useId
} from '@fluentui/react-components'

export const ViewFormPanel: FC = () => {
  const fluentProviderId = useId('fp-view-form-panel')
  const context = usePortfolioAggregationContext()
  const { view, setView, isEditing, onDismiss, onSave } = useViewFormPanel()
  return (
    <Panel
      isOpen={context.state.viewForm?.isOpen}
      headerText={isEditing ? strings.EditViewHeaderText : strings.NewViewHeaderText}
      onRenderFooterContent={() => <ViewFormPanelFooter onSave={onSave} />}
      isFooterAtBottom={true}
      onDismiss={onDismiss}
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
            required={true}
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
            description={strings.DataSourceCategoryDescription}
          >
            <Input value={context.props.dataSourceCategory} disabled={true} />
          </FieldContainer>
          <FieldContainer
            iconName='GroupList'
            label={strings.DataSourceLevelLabel}
            description={strings.DataSourceLevelDescription}
          >
            <Input value={context.props.configuration?.level} disabled={true} />
          </FieldContainer>
        </FluentProvider>
      </IdPrefixProvider>
    </Panel>
  )
}

export * from './useViewFormPanel'
