---
name: Nytt test issue før release
about: Opprettes som sjekkliste for hver PR basert på changelog
title: Test av vX.X.X
labels: ''
assignees: ''

---

## Testing the new version before creating new release

Checklist for testing the additions, changes and fixes

# Version X.X.X

Note to issue creator: Example from changelog (remember to add checkboxes):

## Added

- [ ] Ex: Descriptions on configuration page #301

## Fixed

- [ ] Ex: View in portfolio overview was not changeable for non-admin users #308

## Changed

- [ ] Ex: Disabled "Ny statusrapport" when a report is unpublished. #309

After everything has been checked and approved a release of the new version can be created. It is important that the changelog, this issue and the release notes are equal.

---

## Checklist when building a new release

- [ ] Merge dev to main
    - [ ] Upgrade the [internal 'Prosjektportalen' site](https://pzlcloud.sharepoint.com/sites/ppintern/SitePages/Home.aspx)

- [ ] Build release
- [ ] Test the new release from main
    - [ ] Upgrade ['Prosjektportalen' tenant](https://pzlcloud.sharepoint.com/sites/ppintern/SitePages/Home.aspx)
        - [ ] Further testing
- [ ] Inform
    - [ ] Prosjektportalen brukerforum
    - [ ] Our page
    - [ ] Roadmap
