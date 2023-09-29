import { Panel } from '@fluentui/react'
import {
  Button,
  Field,
  FluentProvider,
  Input,
  Link,
  Textarea,
  Tooltip,
  webLightTheme
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { IRiskActionProps } from '../types'
import { useNewRiskActionPanel } from './useNewRiskActionPanel'
import { ResponsibleField } from './ResponsibleField'
import { Footer } from './Footer'
import styles from './NewRiskActionPanel.module.scss'

/**
 * A dialog component for adding a new risk action.
 */
export const NewRiskActionPanel: FC<IRiskActionProps> = (props) => {
  const {
    model,
    setModel,
    onSave,
    isSaving,
    openPanel,
    closePanel,
    isPanelOpen,
    fluentProviderId,
    tooltipContent
  } = useNewRiskActionPanel(props)
  return (
    <>
      <Tooltip content={tooltipContent} relationship='description'>
        <Link appearance='default' onClick={openPanel}>
          Legg til nytt tiltak 3
        </Link>
      </Tooltip>
      <Panel
        isOpen={isPanelOpen}
        onDismiss={closePanel}
        isLightDismiss={true}
        headerText={`Legg til nytt tiltak for ${props.itemContext.title}`}
        onRenderFooterContent={() => (
          <Footer
            onSave={onSave}
            closePanel={closePanel}
            isSaveDisabled={!model.get('title') || isSaving} />
        )}
      >
        <FluentProvider
          id={fluentProviderId}
          className={styles.content}
          theme={webLightTheme}
          style={{ background: 'transparent' }}
        >
          <Field label='Tittel' required={true}>
            <Input type='text' onChange={(_ev, { value }) => setModel('title', value)} />
          </Field>
          <Field label='Beskrivelse'>
            <Textarea
              onChange={(_ev, { value }) => setModel('description', value)}
              rows={6}
            />
          </Field>
          <Field label='Startdato'>
            <Input type='date' onChange={(_ev, { value }) => setModel('startDate', value)} />
          </Field>
          <Field label='Forfallsdato'>
            <Input type='date' onChange={(_ev, { value }) => setModel('dueDate', value)} />
          </Field>
          <ResponsibleField onChange={(value) => setModel('responsible', value)} />
        </FluentProvider>
      </Panel>
    </>
  )
}
