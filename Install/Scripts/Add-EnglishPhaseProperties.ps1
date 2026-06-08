#Requires -Modules PnP.PowerShell

<#
.SYNOPSIS
    Adds English variants of PhaseSubText and PhaseDescription custom properties to existing taxonomy terms.

.DESCRIPTION
    This script adds PhaseSubText_en-us and PhaseDescription_en-us custom properties to existing
    terms in the Prosjektportalen taxonomy. It updates terms in the main taxonomy (Fase and
    Fase (Program)).

.PARAMETER Url
    The URL of the SharePoint site where the taxonomy is located.

.EXAMPLE
    .\Add-EnglishPhaseProperties.ps1 -Url "https://contoso.sharepoint.com/sites/portfolio"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Url
)

# Connect to SharePoint
Write-Host "Connecting to SharePoint site: $Url" -ForegroundColor Green
Connect-PnPOnline -Url $Url -Interactive -ClientId "da6c31a6-b557-4ac3-9994-7315da06ea3a"

try {
    $termGroup = Get-PnPTermGroup -Identity "Prosjektportalen"
    if (-not $termGroup) {
        throw "Term group 'Prosjektportalen' was not found"
    }
    Write-Host "Found term group: Prosjektportalen" -ForegroundColor Green

    # Fase
    $mainPhases = @{
        "99e85650-33de-4af4-b8db-edffbc8a310b" = @{  # Konsept
            "PhaseSubText_en-us" = "Clarify needs and select concept"
            "PhaseDescription_en-us" = "The concept phase ensures that any project will be the right use of the organization's resources to satisfy a defined need. This is done by investigating alternative concepts and selecting the best one."
        }
        "cda4f1e1-3488-4e57-8a04-6973df239689" = @{  # Planlegge
            "PhaseSubText_en-us" = "Plan overall governance"
            "PhaseDescription_en-us" = "The planning phase ensures that the organization has a good understanding of the work required to implement the project, before management commits to a significant investment."
        }
        "99d7765a-c786-4792-a1a1-866ef0f982b9" = @{  # Gjennomføre
            "PhaseSubText_en-us" = "Execute deliveries and plan sub-phases"
            "PhaseDescription_en-us" = "In the execution phase, you deliver the project's products by implementing sub-phases according to the plans and strategies outlined in the project directive."
        }
        "30e03c52-8c3e-4cfe-9b18-ca71593ce130" = @{  # Avslutte
            "PhaseSubText_en-us" = "Evaluate and close the project"
            "PhaseDescription_en-us" = "The closing phase ensures a structured and formal closure of the project, and a good handover to the line organization."
        }
        "b7ba84f0-70b9-45c4-8c50-8f73bf15bbec" = @{  # Realisere
            "PhaseSubText_en-us" = "Realize goals and benefits"
            "PhaseDescription_en-us" = "Here the organization follows up on its further realization of benefits, and evaluates the achievement of impact goals."
        }
    }

    # Fase (Program)
    $programPhases = @{
        "592ee277-62db-4a62-84f4-9f63faa07224" = @{  # Identifisere
            "PhaseSubText_en-us" = "Identify needs and opportunities"
            "PhaseDescription_en-us" = "Identify organizational needs and opportunities that may require a program for effective solution."
        }
        "50c203e7-f912-4454-afda-d8c373e7f96a" = @{  # Definere
            "PhaseSubText_en-us" = "Clarify goals and scope"
            "PhaseDescription_en-us" = "Specify the program's goals, scope and necessary resources to ensure targeted success."
        }
        "c245386f-6906-410d-ada5-27c64710df90" = @{  # Gjennomføre (Program)
            "PhaseSubText_en-us" = "Implement and follow up activities"
            "PhaseDescription_en-us" = "Actively execute program plans and monitor progress to achieve desired results."
        }
        "5a42cd6a-0fba-46d3-aada-5caaa551915e" = @{  # Avslutte (Program)
            "PhaseSubText_en-us" = "Evaluate and formal closure"
            "PhaseDescription_en-us" = "Systematically evaluate the program's success and ensure a structured closure, including necessary resource allocation."
        }
    }

    function Update-TermProperties {
        param(
            [string]$TermSetName,
            [hashtable]$Phases,
            [string]$Description
        )
        
        Write-Host "`nProcessing $Description..." -ForegroundColor Yellow
        
        $termSet = Get-PnPTermSet -TermGroup $termGroup -Identity $TermSetName -ErrorAction SilentlyContinue
        if (-not $termSet) {
            Write-Warning "Term set '$TermSetName' not found, skipping..."
            return
        }
        
        foreach ($termId in $Phases.Keys) {
            try {
                $term = Get-PnPTerm -TermSet $termSet -TermGroup $termGroup -Identity $termId -ErrorAction SilentlyContinue
                if ($term) {
                    Write-Host "`tUpdating term: $($term.Name)" -ForegroundColor Cyan
                    
                    $properties = $Phases[$termId]
                    Set-PnPTerm -Identity $term.Id -TermSet $termSet -TermGroup $termGroup -LocalCustomProperties $properties
                    foreach ($propertyKey in $properties.Keys) {
                        Write-Host "`t`tAdded property: $propertyKey" -ForegroundColor Gray
                    }
                    
                    Write-Host "`t`t✓ Successfully updated term: $($term.Name)" -ForegroundColor Green
                } else {
                    Write-Warning "`tTerm with ID '$termId' not found in term set '$TermSetName'"
                }
            }
            catch {
                Write-Error "`tFailed to update term with ID '$termId': $($_.Exception.Message)"
            }
        }
    }

    Update-TermProperties -TermSetName "Fase" -Phases $mainPhases -Description "Main Project Phases (Fase)"
    Update-TermProperties -TermSetName "Fase (Program)" -Phases $programPhases -Description "Program Phases (Fase (Program))"

    Write-Host "`n✓ All English phase properties have been successfully added!" -ForegroundColor Green
    Write-Host "Script completed successfully." -ForegroundColor Green

}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
}
finally {
    Write-Host "`nDisconnecting from SharePoint..." -ForegroundColor Yellow
    Disconnect-PnPOnline
}