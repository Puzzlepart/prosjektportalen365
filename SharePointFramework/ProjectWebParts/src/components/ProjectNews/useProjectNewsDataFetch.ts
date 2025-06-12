import { useEffect } from 'react'
import { IProjectNewsProps, IProjectNewsState } from './types'
import { SPHttpClient } from '@microsoft/sp-http'
import { getServerRelativeUrl } from './util'
import strings from 'ProjectWebPartsStrings'

/**
 * Component data fetch hook for `ProjectNews`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param setState Set state callback
 */
export function useProjectNewsDataFetch(
  props: IProjectNewsProps,
  refetch: number,
  setState: (newState: Partial<IProjectNewsState>) => void
) {
  useEffect(() => {
    setState({ loading: true })
    const folderName = props.newsFolderName || strings.NewsFolderNameDefault
    const folderServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages', folderName)
    const url =
      `${props.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderServerRelativeUrl}')/Files` +
      `?$select=Name,ServerRelativeUrl,TimeCreated,TimeLastModified,Author/Title,Editor/Title&$expand=Author,Editor`
    props.spHttpClient
      .get(url, SPHttpClient.configurations.v1)
      .then((res) => res.json())
      .then((data) => {
        console.log('Project News data fetched:', data)
        setState({
          loading: false,
          data: { news: data.value }
        })
      })
      .catch((error) => setState({ loading: false, error }))
  }, [refetch, props.siteUrl, props.newsFolderName])
}
