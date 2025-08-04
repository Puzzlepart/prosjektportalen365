import { useEffect } from 'react'
import { SPHttpClient } from '@microsoft/sp-http'

import { IProjectNewsProps, IProjectNewsState, NewsItem } from './types'
import { getNewsImageUrl, getServerRelativeUrl, ensureAllNewsPromoted } from './util'
import strings from 'ProjectWebPartsStrings'

/**
 * Component data fetch hook for `ProjectNews`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param setState Set state callback
 * @returns void
 */
export function useProjectNewsDataFetch(
  props: IProjectNewsProps,
  refetch: number,
  setState: (newState: Partial<IProjectNewsState>) => void
): void {
  useEffect((): void => {
    setState({ loading: true })
    const fetchData = async (): Promise<void> => {
      try {
        const folderName = props.newsFolderName || strings.NewsFolderNameDefault
        const sitePagesServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages')
        const folderServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages', folderName)
        const url =
          `${props.siteUrl}/_api/web/GetListUsingPath(DecodedUrl=@a1)/items` +
          `?@a1='${sitePagesServerRelativeUrl}'` +
          `&$filter=FileDirRef eq '${folderServerRelativeUrl}'` +
          `&$select=Id,PromotedState,Title,FileLeafRef,BannerImageUrl,Description,Author/Title,Editor/Title,Modified,File/ServerRelativeUrl,File/Name,File/TimeLastModified` +
          `&$expand=Author,Editor,File`

        const res = await props.spHttpClient.get(url, SPHttpClient.configurations.v1)
        const data = await res.json()
        const news = (data.value || [])
          .map(
            (item): NewsItem => ({
              Id: item.Id,
              PromotedState: item.PromotedState || 0,
              name: item.File?.Name || item.Title,
              url: item.File?.ServerRelativeUrl || '#',
              authorName: item.Author?.Title || item.Editor?.Title,
              modifiedDate: item.File?.TimeLastModified || item.Modified,
              imageUrl: getNewsImageUrl(item),
              description: item.Description
            })
          )
          .sort(
            (a, b) =>
              new Date(b.modifiedDate ?? 0).getTime() - new Date(a.modifiedDate ?? 0).getTime()
          )
        // Some users may forget to use the SharePoint "Publish as news" feature after publishing an article,
        // resulting in pages that are not promoted as news (PromotedState !== 2).
        // To ensure all news articles are correctly promoted, we automatically check and promote any items
        // that are not already news articles. This is a workaround for the fact that only the SharePoint UI
        // or the /PromoteToNews endpoint can officially promote a page as news.
        await ensureAllNewsPromoted(
          props.siteUrl,
          props.spHttpClient,
          news,
          props.newsFolderName || strings.NewsFolderNameDefault
        )
        setState({
          loading: false,
          data: { news }
        })
      } catch (error) {
        setState({ loading: false, error })
      }
    }

    fetchData()
  }, [refetch, props.siteUrl, props.newsFolderName])
}
