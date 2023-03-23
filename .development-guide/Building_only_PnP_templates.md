## Building only PnP templates

To only build PnP templates make sure your on the `main` branch and in sync with **origin**.

Run the PowerShell script `Build-Release.ps1` located in the `Install` directory:

```powershell
./Install/Build-Release.ps1 -SkipBuildSharePointFramework
```

The PnP templates should be found in the release folder.
