param([Parameter(Mandatory=$true)][string]$DataDir,[Parameter(Mandatory=$true)][string]$NodeExe,[int]$RetentionDays=30)
$ErrorActionPreference='Stop'
$backupDir=Join-Path $DataDir 'backups'
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$stamp=[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$target=Join-Path $backupDir ('rsvp-'+$stamp+'.sqlite')
& $NodeExe (Join-Path $PSScriptRoot 'backup-wedding.cjs') backup (Join-Path $DataDir 'rsvp.sqlite') $target
if($LASTEXITCODE -ne 0){throw 'backup or integrity check failed'}
$old=Get-ChildItem -LiteralPath $backupDir -File -Filter 'rsvp-*.sqlite' | Where-Object {$_.Name -match '^rsvp-\d{8}T\d{9}Z\.sqlite$' -and $_.LastWriteTimeUtc -lt [DateTime]::UtcNow.AddDays(-$RetentionDays)}
$old | Remove-Item -Force
