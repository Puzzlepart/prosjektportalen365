import { useEffect } from 'react'
import { IProjectNewsProps, IProjectNewsState, NewsItem } from './types'
import { SPHttpClient } from '@microsoft/sp-http'
import { getNewsImageUrl, getServerRelativeUrl } from './util'
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
    const sitePagesServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages')
    const folderServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages', folderName)
    const url =
  `${props.siteUrl}/_api/web/GetListUsingPath(DecodedUrl=@a1)/items` +
  `?@a1='${sitePagesServerRelativeUrl}'` +
  `&$filter=FileDirRef eq '${folderServerRelativeUrl}'` +
  `&$select=Title,FileLeafRef,BannerImageUrl,Description,Author/Title,Editor/Title,Modified,File/ServerRelativeUrl,File/Name,File/TimeLastModified` +
  `&$expand=Author,Editor,File`
    props.spHttpClient
      .get(url, SPHttpClient.configurations.v1)
      .then((res) => res.json())
      .then((data) => {
        const news = (data.value || []).map(
          (item): NewsItem => ({
            name: item.File?.Name || item.Title,
            url: item.File?.ServerRelativeUrl || '#',
            authorName: item.Author?.Title || item.Editor?.Title,
            modifiedDate: item.File?.TimeLastModified || item.Modified,
            imageUrl: getNewsImageUrl(item),
            description: item.Description
          })
        )
        .sort((a, b) => new Date(b.modifiedDate ?? 0).getTime() - new Date(a.modifiedDate ?? 0).getTime())
        setState({
          loading: false,
          data: { news }
        })
      })
      .catch((error) => setState({ loading: false, error }))
  }, [refetch, props.siteUrl, props.newsFolderName])
}
