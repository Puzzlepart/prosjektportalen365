import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IProjectNewsProps } from './types'
import { customLightTheme } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'

export const ProjectNews: FC<IProjectNewsProps> = (props) => {
  const { context, fluentProviderId } = useProjectNews(props)

  return (
    <ProjectNewsContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <h1>Hello, {props.christopherProp}</h1>
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectNewsContext.Provider>
  )
}

ProjectNews.defaultProps = {
  christopherProp: 'Christopher'
}
