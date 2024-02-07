## Bygge en ny utgivelse

For å lage en ny Prosjektportalen utgivelse, forsikre deg om at du er på `main` branch og synkronisert med **origin**.

Kjør PowerShell-skriptet `Build-Release.ps1` som ligger i `Install`-mappen:

```powershell
./Install/Build-Release.ps1

# For å kun bygge PnP-maler, bruk parameteren -SkipBuildSharePointFramework
```

Installasjonspakken skal finnes i utgivelsesmappen.
