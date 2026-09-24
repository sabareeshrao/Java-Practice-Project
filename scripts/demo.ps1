param([string]$BaseUrl = 'http://localhost:8080', [string]$Password = $env:SURVEY_MANAGER_PASSWORD)
$ErrorActionPreference = 'Stop'
if (!$Password) { throw 'Set SURVEY_MANAGER_PASSWORD to the same password used to start the application.' }
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("manager:$Password"))
$headers = @{Authorization="Basic $encoded"}
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$csrf = Invoke-RestMethod "$BaseUrl/api/v1/csrf" -Headers $headers -WebSession $session
$headers[$csrf.headerName] = $csrf.token
$name = 'Hyderabad corridor ' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff')
$project = Invoke-RestMethod "$BaseUrl/api/v1/projects" -Method Post -Headers $headers -WebSession $session -ContentType 'application/json' -Body (@{name=$name;srid=32644}|ConvertTo-Json)
$sample = Join-Path (Split-Path $PSScriptRoot -Parent) 'samples/hyderabad-ground.csv'
# PowerShell 7 provides multipart -Form support.
$project = Invoke-RestMethod "$BaseUrl/api/v1/projects/$($project.id)/points?version=$($project.version)" -Method Post -Headers $headers -WebSession $session -Form @{file=Get-Item -LiteralPath $sample}
$qa = Invoke-RestMethod "$BaseUrl/api/v1/projects/$($project.id)/quality" -Method Post -Headers $headers -WebSession $session -ContentType 'application/json' -Body (@{version=$project.version;measured=@(510.01,510.12,510.19);reference=@(510,510.1,510.2)}|ConvertTo-Json)
$project = Invoke-RestMethod "$BaseUrl/api/v1/projects/$($project.id)" -Headers $headers -WebSession $session
foreach ($action in @('approve','deliver')) {
    $project = Invoke-RestMethod "$BaseUrl/api/v1/projects/$($project.id)/$action" -Method Post -Headers $headers -WebSession $session -ContentType 'application/json' -Body (@{version=$project.version}|ConvertTo-Json)
}
$project | Select-Object id,name,status,pointCount,rmse
