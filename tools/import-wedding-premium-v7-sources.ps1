param(
 [Parameter(Mandatory=$true)][string]$ZipPath,
 [switch]$VerifyOnly
)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$base=Join-Path $root 'assets\imperial-premium-v7'
$source=Get-Content -LiteralPath (Join-Path $base 'source-manifest.json') -Raw | ConvertFrom-Json
$web=Get-Content -LiteralPath (Join-Path $base 'manifest.json') -Raw | ConvertFrom-Json
if($source.version -ne 'premium-v7-source-manifest' -or @($source.files).Count -ne 10 -or @($web.files).Count -ne 17 -or $source.sourceArchiveSha256 -ne $web.sourceArchiveSha256){throw 'Unexpected tracked manifests'}
$expected=@($source.files)+@($web.files)
$paths=@($expected | ForEach-Object {$_.path})
if(@($paths | Sort-Object -Unique).Count -ne 27){throw 'Duplicate tracked asset paths'}
foreach($f in $source.files){if($f.path -cnotmatch '^sources/[a-z0-9-]+\.png$'){throw 'Invalid source path'}}
foreach($f in $web.files){if($f.path -cnotmatch '^web/[a-z0-9-]+\.webp$'){throw 'Invalid web path'}}
function Assert-Asset($parent,$f){
 $p=Join-Path $parent $f.path
 if(!(Test-Path -LiteralPath $p -PathType Leaf)){throw ('Missing asset: '+$f.path)}
 if((Get-Item -LiteralPath $p).Length -ne $f.bytes -or (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -cne $f.sha256){throw ('Asset mismatch: '+$f.path)}
}
if(!(Test-Path -LiteralPath $ZipPath -PathType Leaf)){throw 'Delivery ZIP not present'}
if((Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $source.sourceArchiveSha256){throw 'ZIP SHA256 mismatch'}
foreach($f in $web.files){Assert-Asset $base $f}
$dst=Join-Path $base 'sources'
if(Test-Path -LiteralPath $dst){throw 'Sources destination exists; refuse overwrite'}
$stage=Join-Path $base ('.source-import-'+[Guid]::NewGuid().ToString('N'))
try {
 Expand-Archive -LiteralPath $ZipPath -DestinationPath $stage
 $m=Get-Content -LiteralPath (Join-Path $stage 'manifest.json') -Raw | ConvertFrom-Json
 if($m.version -ne 'premium-v7-full' -or @($m.files).Count -ne 27){throw 'Unexpected archive manifest'}
 foreach($f in $expected){
  $entry=@($m.files | Where-Object {$_.path -ceq $f.path})
  if($entry.Count -ne 1 -or $entry[0].sha256 -cne $f.sha256 -or $entry[0].bytes -ne $f.bytes){throw ('Manifest mismatch: '+$f.path)}
  Assert-Asset $stage $f
 }
 if(@(Get-ChildItem -LiteralPath $stage -Recurse -File -Force).Count -ne 29){throw 'Unexpected archive file count'}
 if($VerifyOnly){'VERIFIED: 10 PNG + 17 WebP; no files imported';return}
 # Rename only the validated PNG directory on the same volume. Never replace existing assets.
 [IO.Directory]::Move((Join-Path $stage 'sources'),$dst)
 foreach($f in $source.files){Assert-Asset $base $f}
 'IMPORTED: 10 original PNG masters; existing 17 WebP unchanged'
} finally {
 if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}
}
