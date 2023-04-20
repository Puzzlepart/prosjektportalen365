declare interface IPortfolioExtensionsStrings {
  SiteSettingsLinkText: ReactNode
  LinksListText: ReactNode
  LatestGitHubReleaseLinkTitle: string
  LatestGitHubReleaseDownloadButtonText: string
  LatestGitHubReleaseIsNewerText: any
  LatestGitHubReleaseIsOlderText: any
  LatestGitHubReleaseIsSameText: any
  LatestGitHubReleaseLabel: string | number | boolean | {} | ReactElement<any, string | JSXElementConstructor<any>> | ReactNodeArray | ReactPortal
  SetRecommendationTitle: string
  SetRecommendationSubtitle: string
  IdeaProjectDataDialogTitle: string
  IdeaProjectDataDialogSubText: string
  IdeaProjectDataDialogInfoText: string
  IdeaProjectDataDialogBlockedText: string
  IdeaProcessorsSiteGroup: string
  IdeaProcessingTitle: string
  IdeaProcessingUrlTitle: string
  IdeaRegistrationTitle: string
  IdeaRegistrationUrlTitle: string
  IdeaProjectDataTitle: string
  ApproveChoice: string
  ConsiderationChoice: string
  RejectChoice: string
  ApprovedSyncText: string
  ApprovedText: string
  ConsiderationText: string
  RejectedText: string
  IdeaAlreadyApproved: string
  ActionLabel: string
  ActionLabelPlaceholder: string
  CommentLabel: string
  CommentLabelPlaceholder: string
  CancelLabel: string
  CloseLabel: string
  SubmitLabel: string
  CreateLabel: string
  InstallStartTimeLabel: string
  InstallEndTimeLabel: string
  InstallVersionLabel: string
  InstallCommandLabel: string
  InstallChannelLabel: string
  LastInstallHeaderText: string
  SeeAllInstallationsLinkText: string
  InstallationLogListName: string
  ConfigurationLinkText: string
  InstallDurationLabel: string
  InstallDurationValueTemplate: string
  LinksListName: string
}

declare module 'PortfolioExtensionsStrings' {
  const strings: IPortfolioExtensionsStrings;
  export = strings;
}
