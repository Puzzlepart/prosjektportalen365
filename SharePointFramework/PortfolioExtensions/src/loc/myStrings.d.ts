declare interface IPortfolioExtensionsStrings {
  ActionLabel: string
  ActionLabelPlaceholder: string
  ApproveChoice: string
  ApprovedSyncText: string
  CancelLabel: string
  CloseLabel: string
  CommentLabel: string
  CommentLabelPlaceholder: string
  ConfigurationLinkText: string
  ConsiderationChoice: string
  CreateLabel: string
  HelpContentLinkText: string
  HelpContentListName: string
  IdeaAlreadyApproved: string
  IdeaConfigurationTitle: string
  IdeaProcessorsSiteGroup: string
  IdeaProjectDataDialogBlockedTitle: string
  IdeaProjectDataDialogBlockedText: string
  IdeaProjectDataDialogInfoTitle: string
  IdeaProjectDataDialogTitle: string
  IdeaProjectDataTitle: string
  InstallationLogListName: string
  InstallChannelLabel: string
  InstallCommandLabel: string
  InstallDurationLabel: string
  InstallDurationValueTemplate: string
  InstallEndTimeLabel: string
  InstallStartTimeLabel: string
  InstallVersionLabel: string
  LastInstallHeaderText: string
  LatestGitHubReleaseDownloadButtonText: string
  LatestGitHubReleaseIsNewerText: any
  LatestGitHubReleaseIsOlderText: any
  LatestGitHubReleaseIsSameText: any
  LatestGitHubReleaseLabel: string
  LatestGitHubReleaseLinkTitle: string
  LinksListName: string
  LinksListText: ReactNode
  RejectChoice: string
  SeeAllInstallationsLinkText: string
  SetRecommendationDefaultDescription: string
  SetRecommendationSubtitle: string
  SetRecommendationTitle: string
  SiteSettingsLinkText: ReactNode
  SubmitLabel: string
}

declare module 'PortfolioExtensionsStrings' {
  const strings: IPortfolioExtensionsStrings;
  export = strings;
}
