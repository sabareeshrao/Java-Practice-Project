$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$project=Split-Path $root -Parent
$out=Join-Path $project 'target/jpms'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$sources=Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'src') -Filter *.java -Recurse | Select-Object -ExpandProperty FullName
& javac --module-source-path (Join-Path $PSScriptRoot 'src') -d $out @sources
if($LASTEXITCODE -ne 0){throw 'JPMS compilation failed'}
& java --module-path $out --module com.aerotopo.app/com.aerotopo.app.Main
if($LASTEXITCODE -ne 0){throw 'JPMS execution failed'}
