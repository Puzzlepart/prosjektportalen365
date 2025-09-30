#Requires -Modules PnP.PowerShell

<#
.SYNOPSIS
    Adds English variants of PhaseSubText and PhaseDescription custom properties to existing taxonomy terms.

.DESCRIPTION
    This script adds PhaseSubText_en-us and PhaseDescription_en-us custom properties to existing 
    terms in the Prosjektportalen taxonomy. It updates terms in both the main taxonomy (Fase and 
    Fase (Program)) and the building/construction taxonomy (Fase (Bygg) and Fase (Anlegg)).

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

    # Fase (Bygg)
    $buildingPhases = @{
        "35997358-534f-475b-be9f-2544a3b80c8d" = @{  # Avklare behov
            "PhaseSubText_en-us" = "Feasibility study (F0), Program phase (F1)"
            "PhaseDescription_en-us" = "This phase focuses on clarifying the project's purpose and specific requirements through thorough analysis and development of a detailed program."
        }
        "1692b4b4-bfce-4614-91b9-767d1bbb0c6b" = @{  # Konseptutvikling og bearbeiding
            "PhaseSubText_en-us" = "Sketch project (F2), Pre-project (F2), Detail project (F2)"
            "PhaseDescription_en-us" = "In this phase, ideas and concepts are further developed through sketch projects, pre-projects and detail projects to create a solid and realistic plan."
        }
        "41c4d900-ec57-4779-a218-35e302b69e21" = @{  # Detaljprosjektering
            "PhaseSubText_en-us" = "Construction phase (F3), Final phase and handover"
            "PhaseDescription_en-us" = "Here technical details and material choices are specified, and plans are developed for the actual construction process, completion and handover of the project."
        }
        "2adec1fc-dc6d-4db7-bb5f-067287010fb7" = @{  # Utførelse
            "PhaseSubText_en-us" = "Trial operation"
            "PhaseDescription_en-us" = "In this phase, the construction is materialized, and necessary tests are conducted to ensure that everything functions as intended."
        }
        "37f7238a-8d96-4d28-b3e1-ac2a9c59b40c" = @{  # Overlevering
            "PhaseSubText_en-us" = "Management, Maintenance"
            "PhaseDescription_en-us" = "This phase focuses on a structured transfer of the project to the operational phase, including implementation of management and maintenance procedures."
        }
    }

    # Fase (Anlegg)
    $constructionPhases = @{
        "dca0a226-0907-4c54-8624-6b51fcac7a92" = @{  # Initiering
            "PhaseSubText_en-us" = "Identification of needs and startup"
            "PhaseDescription_en-us" = "The initiation phase is the initial phase of the construction project, where the need for the project is identified and the planning process is started."
        }
        "1c286a0e-da40-451a-bab2-9e0583392ee3" = @{  # Prosjektering og kontrahering
            "PhaseSubText_en-us" = "Project design and contract execution"
            "PhaseDescription_en-us" = "In this phase, the project is thoroughly planned and the necessary contracts are entered into with relevant parties."
        }
        "9b45a1ca-ae8c-4f4a-baa3-40353b7dd8fc" = @{  # Anleggsfase
            "PhaseSubText_en-us" = "Realization of construction"
            "PhaseDescription_en-us" = "In this phase, the actual construction is carried out in accordance with the plans developed in the previous phase."
        }
        "1807d6c2-b4bd-415f-98aa-a4a2ccff8d11" = @{  # Overtakelse og overlevering
            "PhaseSubText_en-us" = "Testing and formal project closure"
            "PhaseDescription_en-us" = "Here necessary tests and inspections are conducted before the project is formally completed and handed over to the responsible party."
        }
        "2f757e1c-7e2b-4be6-9eba-ecafe37531b6" = @{  # Bruks og driftsfase
            "PhaseSubText_en-us" = "Implementation of operational and maintenance procedures"
            "PhaseDescription_en-us" = "This phase focuses on implementing routines and procedures for effective operation and maintenance of the facility in use."
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
    Update-TermProperties -TermSetName "Fase (Bygg)" -Phases $buildingPhases -Description "Building Phases (Fase (Bygg))"
    Update-TermProperties -TermSetName "Fase (Anlegg)" -Phases $constructionPhases -Description "Construction Phases (Fase (Anlegg))"

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