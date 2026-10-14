@echo off
rem Checks the environment and starts the guided installation/upgrade of Prosjektportalen 365.
rem Batch files are not subject to the PowerShell execution policy, and neither is "pwsh -Command",
rem which is why the checks run from here before handing over to Scripts\Start-InstallWizard.ps1.
rem Install.ps1 can still be run directly with parameters; this launcher is optional.
setlocal EnableExtensions

set "PP365_ROOT=%~dp0"
set "PP365_ROOT=%PP365_ROOT:~0,-1%"

echo.
echo Prosjektportalen 365 - installation launcher
echo ============================================
echo.

rem Explorer can "open" a zip and run a single file from a temporary copy without the rest of the release
if not exist "%PP365_ROOT%\PnP.PowerShell\" goto :not_extracted
if not exist "%PP365_ROOT%\Templates\Portfolio.pnp" goto :not_extracted
if not exist "%PP365_ROOT%\Scripts\Start-InstallWizard.ps1" goto :not_extracted

set "PWSH="
for /f "delims=" %%P in ('where pwsh.exe 2^>nul') do if not defined PWSH set "PWSH=%%P"
if not defined PWSH if exist "%ProgramFiles%\PowerShell\7\pwsh.exe" set "PWSH=%ProgramFiles%\PowerShell\7\pwsh.exe"
if not defined PWSH goto :no_pwsh

rem PnP.PowerShell 3.x requires PowerShell 7.4 or newer
"%PWSH%" -NoProfile -NoLogo -NonInteractive -Command "Write-Host ('Found PowerShell ' + $PSVersionTable.PSVersion + ' in ' + $PSHOME); exit [int]($PSVersionTable.PSVersion -lt [version]'7.4')"
if errorlevel 1 goto :old_pwsh

echo Removing the "downloaded from the internet" mark from the release files...
"%PWSH%" -NoProfile -NoLogo -NonInteractive -Command "Get-ChildItem -LiteralPath $env:PP365_ROOT -Recurse -File | Unblock-File"
if errorlevel 1 echo [WARNING] Could not unblock all files. If the installation fails to load scripts, right-click the zip, choose Properties, tick Unblock and extract it again.

rem An execution policy set by Group Policy overrides -ExecutionPolicy Bypass. We explain it rather than work around it.
"%PWSH%" -NoProfile -NoLogo -NonInteractive -Command "$Policy = @('MachinePolicy', 'UserPolicy') | ForEach-Object { [string](Get-ExecutionPolicy -Scope $_) } | Where-Object { $_ -in @('AllSigned', 'Restricted') } | Select-Object -First 1; if ($Policy) { Write-Host ('PowerShell execution policy is set to ' + $Policy + ' by Group Policy.'); exit 1 }"
if errorlevel 1 goto :gpo_policy

echo.
"%PWSH%" -NoProfile -NoLogo -ExecutionPolicy Bypass -File "%PP365_ROOT%\Scripts\Start-InstallWizard.ps1"
set "PP365_EXITCODE=%ERRORLEVEL%"
echo.
pause
exit /b %PP365_EXITCODE%

:not_extracted
echo [ERROR] The release files are missing next to Start-Install.cmd.
echo         Extract the whole zip file first (right-click the zip ^> Extract All...), then run
echo         Start-Install.cmd from the extracted folder.
goto :fail

:no_pwsh
echo [ERROR] PowerShell 7 was not found on this computer. Windows PowerShell 5.1, which comes with Windows, is not enough.
echo.
echo         Install PowerShell 7.4 or newer in one of these ways:
echo.
echo           - winget install --id Microsoft.PowerShell --source winget
goto :pwsh_guidance

:old_pwsh
echo [ERROR] Prosjektportalen 365 requires PowerShell 7.4 or newer.
echo.
echo         Update PowerShell 7 in one of these ways:
echo.
echo           - winget upgrade --id Microsoft.PowerShell --source winget
goto :pwsh_guidance

:pwsh_guidance
echo           - Download the MSI from https://aka.ms/powershell-release?tag=lts
echo           - Install "PowerShell" from the Microsoft Store (no administrator rights needed)
echo.
echo         Then close this window and run Start-Install.cmd again.
echo         If your organization manages software centrally, ask your IT department for PowerShell 7.4 or newer.
goto :fail

:gpo_policy
echo [ERROR] Group Policy only allows signed PowerShell scripts on this computer, so the installation scripts cannot run.
echo         Ask your IT department to allow the scripts, or run the installation from a computer without this policy.
goto :fail

:fail
echo.
pause
exit /b 1
