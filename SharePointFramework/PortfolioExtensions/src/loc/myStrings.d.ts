declare interface IPortfolioExtensionsStrings {
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
}

declare module 'PortfolioExtensionsStrings' {
  const strings: IPortfolioExtensionsStrings;
  export = strings;
}
