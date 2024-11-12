import React, { FC } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import { Divider, FluentProvider, IdPrefixProvider, Spinner } from '@fluentui/react-components'
import { customLightTheme, UserMessage } from 'pp365-shared-library'
import { IdeaField } from './IdeaField'
import { IdeaPhaseBar } from './IdeaPhaseBar'
import { IdeaNav } from './IdeaNav'

export const IdeaModule: FC<IIdeaModuleProps> = (props) => {
  const { state, setState, isOpen, renderHamburger, fluentProviderId } = useIdeaModule(props)

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {state.loading ? (
            <Spinner label='Laster inn idémodulen' size='extra-large' />
          ) : (
            <div className={styles.ideaModule}>
              <IdeaNav />
              <div className={styles.content}>
                {state.error && (
                  <UserMessage
                    title='Det skjedde en feil ved innlastning av Idémodulen'
                    text={state.error}
                    intent='error'
                  />
                )}
                {state.selectedIdea ? (
                  <>
                    <div className={styles.ideaHeader}>
                      <div className={styles.toolbar}>
                        <div className={styles.hamburger}>{!isOpen && renderHamburger()}</div>
                        <IdeaPhaseBar />
                      </div>
                      <h1 className={styles.ideaTitle}>{state.selectedIdea.item.Title}</h1>
                    </div>
                    <div className={styles.idea}>
                      {state.selectedIdea.registeredFieldValues.map((model, idx) => (
                        <IdeaField key={idx} model={model} />
                      ))}
                    </div>
                    <Divider />
                    <div className={styles.idea}>
                      {state.selectedIdea.processingFieldValues?.map((model, idx) => (
                        <IdeaField key={idx} model={model} />
                      ))}
                    </div>
                  </>
                ) : (
                  <Spinner label='Laster inn idé' size='medium' />
                )}
              </div>
            </div>
          )}
        </FluentProvider>
      </IdPrefixProvider>
    </IdeaModuleContext.Provider>
  )
}

IdeaModule.defaultProps = {
  configurationList: 'Idékonfigurasjon',
  configuration: 'Standard',
  hiddenRegFields: ['Title'],
  hiddenProcFields: [
    'Title',
    'GtIdeaUrl',
    'GtRegistratedIdea',
    'GtIdeaProjectData',
    'GtIdeaStrategicValue',
    'GtIdeaStrategicNumber',
    'GtIdeaQualityBenefit',
    'GtIdeaQualityNumber',
    'GtIdeaEconomicBenefit',
    'GtIdeaEconomicNumber',
    'GtIdeaOperationalNeed',
    'GtIdeaOperationalNumber',
    'GtIdeaRisk',
    'GtIdeaRiskNumber',
    'GtIdeaManualScore',
    'GtIdeaManualComment',
    'GtIdeaScore',
    'GtIdeaPriority'
  ]
}
