param([Parameter(Mandatory=$true)][string]$DataDir,[Parameter(Mandatory=$true)][string]$NodeExe,[int]$Port=18763,[string]$PublicOrigin='')
$ErrorActionPreference='Stop'
$tokenFile=Join-Path $DataDir 'admin-token.txt'
if(!(Test-Path -LiteralPath $tokenFile)){throw 'Provision protected admin token before starting'}
$env:WEDDING_DATA_DIR=$DataDir
$env:WEDDING_ADMIN_TOKEN=[IO.File]::ReadAllText($tokenFile).Trim()
$env:WEDDING_HOST='127.0.0.1'
$env:WEDDING_PORT=[string]$Port
$env:WEDDING_PUBLIC_ORIGIN=$PublicOrigin
& $NodeExe (Join-Path $PSScriptRoot 'wedding-server.cjs')
exit $LASTEXITCODE
