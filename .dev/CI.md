# Continuous integration

![CI - Build and install (dev)](https://github.com/Puzzlepart/prosjektportalen365/workflows/CI%20-%20Build%20and%20install%20(dev)/badge.svg?branch=dev)

We have set up continuous using GitHub actions.

## Build and install (dev)

[ci-build-install-dev](../.github/workflows/ci-dev.yml) builds a new release on _push_ to **dev**.

It runs [Build-Release.ps1](../Install/Build-Release.ps1) with `-CI` param, then runs [Install.ps1](../Install/Install.ps1) (also with `-CI` param, this time with a encoded string consisting of the username and password, stored in a GitHub secret). The URL to install to is stored in the GitHub secret `CI_DEV_TARGET_URL`.

With the current approach, with no cache, a full run takes about 30 minutes.

![image-20201121133532960](assets/image-20201121133532960.png)

