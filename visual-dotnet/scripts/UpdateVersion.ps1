param (
    [Parameter(Mandatory=$true)][string]$projectFile,
    [Parameter(Mandatory=$true)][string]$releaseType
)

function Update-Version {
    param (
        [string]$version,
        [string]$releaseType
    )
    [Int32[]]$subVersion = $version.Split('.')

    if ($releaseType.Equals("major")) {
        $subVersion[0] = $subVersion[0] + 1
        $subVersion[1] = 0
        $subVersion[2] = 0
    }

    if ($releaseType.Equals("minor")) {
        $subVersion[1] = $subVersion[1] + 1
        $subVersion[2] = 0
    }

    if ($releaseType.Equals("patch")) {
        $subVersion[2] = $subVersion[2] + 1
    }
    return $subVersion -join "."
};


$possibleReleaseType = "major","minor","patch"
if (!$possibleReleaseType.Contains($releaseType)) {
    throw "$releaseType is not a valid upgrade"
}

if (!$projectFile.EndsWith(".csproj")) {
    throw  "$projectFile is not a valid C# project"
}

[xml]$projectContent = Get-Content $projectFile

$versionElement = $projectContent.SelectSingleNode("//Project/PropertyGroup/Version")

[string]$version = $versionElement.InnerText
[string]$newVersion = Update-Version -version $version -releaseType $releaseType

$versionElement.InnerText = $newVersion
$projectContent.Save($projectFile)
Write-Output $newVersion
