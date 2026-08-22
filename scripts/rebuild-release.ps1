$ErrorActionPreference = "Continue"
$log = "C:\dev\ndv\.audit\rebuild.log"
"=== rebuild started $(Get-Date) ===" | Out-File $log

Set-Location C:\dev\ndv
npm run app:sync *>> $log
if ($LASTEXITCODE -ne 0) { "APP SYNC FAILED" | Out-File $log -Append; exit 1 }

Set-Location C:\dev\ndv\android
.\gradlew.bat bundleRelease assembleDebug --no-daemon *>> $log
"=== gradle exit: $LASTEXITCODE ===" | Out-File $log -Append

Get-ChildItem C:\dev\ndv\android\app\build\outputs\bundle\release, C:\dev\ndv\android\app\build\outputs\apk\debug -File -ErrorAction SilentlyContinue |
  Select-Object Name, Length, LastWriteTime | Out-String | Out-File $log -Append
