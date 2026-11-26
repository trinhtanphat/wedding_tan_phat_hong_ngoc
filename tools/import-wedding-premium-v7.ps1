param([Parameter(Mandatory=$true)][string]$ZipPath)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$expected='96002c399d88b4edbac6461debdce0e663458103147a20de6fd7ac6fb62e8feb'
if(!(Test-Path -LiteralPath $ZipPath -PathType Leaf)){throw 'Delivery ZIP not present'}
if((Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).Hash.ToLower() -ne $expected){throw 'ZIP SHA256 mismatch'}
$dst=Join-Path $root 'assets\imperial-premium-v7'
if(Test-Path -LiteralPath $dst){throw 'Destination exists; refuse overwrite'}
$stage=Join-Path ([IO.Path]::GetTempPath()) ('wedding-v7-'+[Guid]::NewGuid().ToString('N'))
try{
 Expand-Archive -LiteralPath $ZipPath -DestinationPath $stage
 $m=Get-Content -LiteralPath (Join-Path $stage 'manifest.json') -Raw|ConvertFrom-Json
 if($m.version -ne 'premium-v7' -or @($m.files).Count -ne 20){throw 'Unexpected manifest'}
 foreach($f in $m.files){
  if($f.path -notmatch '^(sources/[a-z0-9-]+\.png|web/[a-z0-9-]+\.webp)$'){throw 'Unexpected path'}
  $p=Join-Path $stage $f.path
  if(!(Test-Path -LiteralPath $p -PathType Leaf)){throw 'Missing asset'}
  if((Get-Item -LiteralPath $p).Length -ne $f.bytes -or (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() -ne $f.sha256){throw ('Asset mismatch: '+$f.path)}
 }
 if(@(Get-ChildItem -LiteralPath $stage -Recurse -File).Count -ne 22){throw 'Unexpected package contents'}
 Move-Item -LiteralPath $stage -Destination $dst
 'VERIFIED: 9 PNG sources + 11 WebP assets imported'
 'Assets staged on disk only. Review, git add, commit, push and verify remote SHA before deploying.'
}finally{if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}}
