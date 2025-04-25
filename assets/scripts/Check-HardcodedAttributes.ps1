Param (
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $false, HelpMessage = "Node to check in the XML files.")]
    [string]$Node = "Field",
    [Parameter(Mandatory = $false, HelpMessage = "Attributes to check for hardcoded values. Default is DisplayName and Description.")]
    [string[]]$AttributesToCheck = @("DisplayName", "Description")
)

function Get-Nodes {
    Param (
        [xml]$XmlContent
    )
    $NamespaceManager = New-Object System.Xml.XmlNamespaceManager($XmlContent.NameTable)
    $NamespaceManager.AddNamespace("pnp", "http://schemas.dev.office.com/PnP/2020/05/ProvisioningSchema")
    $Nodes = $XmlContent.SelectNodes("//$Node", $NamespaceManager)
    if ($Nodes.Count -eq 0) {
        try {
            return @($XmlContent | Select-Object -ExpandProperty ($Node -Replace "pnp:", "") -ErrorAction Stop)
        }
        catch {
            return @()
        }
    }
    return $Nodes
}

function Check-HardcodedAttributes {
    Param (
        [xml]$XmlContent,
        [string]$FilePath,
        [string[]]$Attributes
    )
    $Nodes = Get-Nodes -XmlContent $XmlContent
    foreach ($n in $Nodes) {
        foreach ($attr in $Attributes) {
            $value = $n.GetAttribute($attr)
            if ($value -and -not $value.StartsWith("{resource:")) {
                Write-Output "$FilePath - $($attr): $value"
            }
        }
    }
}

# Get all XML files in the folder or single file
$files = @()
if (Test-Path $Path -PathType Container) {
    $files = Get-ChildItem -Path $Path -Recurse -Filter *.xml
}
elseif (Test-Path $Path -PathType Leaf) {
    $files = @((Get-Item $Path))
}
else {
    Write-Error "Path not found: $Path"
    exit 1
}

foreach ($file in $files) {
    try {
        [xml]$xml = Get-Content $file.FullName -Raw
        Check-HardcodedAttributes -XmlContent $xml -FilePath $file.FullName -Attributes $AttributesToCheck
    }
    catch {
        Write-Warning "Failed to load XML: $($file.FullName) - $_"
    }
}
