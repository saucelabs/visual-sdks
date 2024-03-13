param (
    [Parameter(Mandatory=$true)][string]$projectFile,
    [Parameter(Mandatory=$true)][string]$flavor
)

function Update-Version {
    param (
        [string]$version,
        [string]$flavor
    )
    [Int32[]]$subVersion = $version.Split('.')

    if ($flavor.Equals("major")) {
        $subVersion[0] = $subVersion[0] + 1
        $subVersion[1] = 0
        $subVersion[2] = 0
    }

    if ($flavor.Equals("minor")) {
        $subVersion[1] = $subVersion[1] + 1
        $subVersion[2] = 0
    }

    if ($flavor.Equals("patch")) {
        $subVersion[2] = $subVersion[2] + 1
    }
    return $subVersion -join "."
};


$possibleFlavor = "major","minor","patch"
if (!$possibleFlavor.Contains($flavor)) {
    throw "$flavor is not a valid upgrade"
}

if (!$projectFile.EndsWith(".csproj")) {
    throw  "$projectFile is not a valid C# project"
}

[xml]$projectContent = Get-Content $projectFile

$versionElement = $projectContent.SelectSingleNode("//Project/PropertyGroup/Version")

Write-Output $versionElement
[string]$version = $versionElement.InnerText
[string]$newVersion = Update-Version -version $version -flavor $flavor

$versionElement.InnerText = $newVersion

$projectContent.Save($projectFile)
