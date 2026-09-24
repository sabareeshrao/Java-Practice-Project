param([Parameter(ValueFromRemainingArguments=$true)][string[]]$MavenArgs)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    $maven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($maven) { & $maven.Source @MavenArgs }
    else {
        $jetbrains = Join-Path $env:ProgramFiles 'JetBrains'
        $candidates = Get-ChildItem -LiteralPath $jetbrains -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'plugins\maven-plugin\lib\maven3\bin\mvn.cmd' } |
            Where-Object { Test-Path -LiteralPath $_ }
        if (!$candidates) { throw 'Install Maven 3.6.3+ and add its bin directory to PATH.' }
        & ($candidates | Select-Object -First 1) @MavenArgs
    }
    if ($LASTEXITCODE -ne 0) { throw "Maven failed with exit code $LASTEXITCODE" }
} finally { Pop-Location }
