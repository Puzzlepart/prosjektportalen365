import { useEffect } from 'react'
import { SPHttpClient } from '@microsoft/sp-http'
import { INewsItem, IProjectNewsProps, IProjectNewsState } from './types'
import { toODataString, toUrlPath } from './rest'
import {
  getNewsImageUrl,
  getServerRelativeUrl,
  isNewsAccessDenied,
  newsNoAccessError
} from './util'
import strings from 'ProjectWebPartsStrings'

/** Loads project-folder news from the configured site and reports access or request failures. */
export function useProjectNewsDataFetch(
  props: IProjectNewsProps,
  refetch: number,
  setState: (newState: Partial<IProjectNewsState>) => void
): void {
  useEffect((): void => {
    // A refetch starts without the error an earlier one left, such as a news site since made readable.
    setState({ loading: true, error: null })
    const fetchData = async (): Promise<void> => {
      try {
        // The news site comes from the hub's settings (`ProjectNewsHubUrl`) unless the web part
        // names one: without either, the hub could not be read.
        if (!props.siteUrl) throw newsNoAccessError()
        const folderName = props.newsFolderName || strings.NewsFolderNameDefault
        const sitePagesServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages')
        const folderServerRelativeUrl = getServerRelativeUrl(props.siteUrl, 'SitePages', folderName)
        const currentSiteId = props.context.pageContext.site.id.toString()
        const url =
          `${props.siteUrl}/_api/web/GetListUsingPath(DecodedUrl=@a1)/items` +
          `?@a1=${toODataString(sitePagesServerRelativeUrl)}` +
          `&$filter=FileDirRef eq ${toODataString(folderServerRelativeUrl)}` +
          ` and GtSiteId eq ${toODataString(currentSiteId)}` +
          '&$select=Id,PromotedState,Title,FileLeafRef,BannerImageUrl,Description,GtSiteId,Author/Title,Editor/Title,Modified,File/ServerRelativeUrl,File/Name,File/TimeLastModified' +
          '&$expand=Author,Editor,File'

        const res = await props.spHttpClient.get(url, SPHttpClient.configurations.v1)
        // Without this a refused request read as no news.
        if (isNewsAccessDenied(res)) throw newsNoAccessError()
        const data = await res.json()
        const news = (data.value || [])
          .map((item): INewsItem => ({
            id: item.Id,
            promotedState: item.PromotedState || 0,
            name: item.File?.Name || item.Title,
            url: item.File?.ServerRelativeUrl ? toUrlPath(item.File.ServerRelativeUrl) : '#',
            authorName: item.Editor?.Title || item.Author?.Title,
            modifiedDate: item.File?.TimeLastModified || item.Modified,
            imageUrl: getNewsImageUrl(item),
            description: item.Description
          }))
          .sort(
            (a, b) =>
              new Date(b.modifiedDate ?? 0).getTime() - new Date(a.modifiedDate ?? 0).getTime()
          )

        setState({
          loading: false,
          data: { news }
        })
      } catch (error) {
        setState({ loading: false, error })
      }
    }

    void fetchData()
  }, [refetch, props.siteUrl, props.newsFolderName, props.context.pageContext.site.id])
}
