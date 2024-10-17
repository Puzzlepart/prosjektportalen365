import React, { FC } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export const IdeaModule: FC<IIdeaModuleProps> = (props) => {
  const { state, setState, fluentProviderId } = useIdeaModule(props)

  return (
    <div className={styles.ideaModule}>
      <IdeaModuleContext.Provider value={{ props, state, setState }}>
        <IdPrefixProvider value={fluentProviderId}>
          <FluentProvider theme={customLightTheme}>
            <div className={styles.container}>
              <h1>Bring your ideas to life. Here you can create, share and collaborate on ideas.</h1>
              <p>With the new Idea module, you can create and share ideas with your team. You can also collaborate on ideas with your team members.</p>
            </div>
          </FluentProvider>
        </IdPrefixProvider>
      </IdeaModuleContext.Provider>
    </div>
  )
}

IdeaModule.defaultProps = {
  configurationList: 'Idékonfigurasjon'
}
