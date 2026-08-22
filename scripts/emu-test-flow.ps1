$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$out = "C:\dev\ndv\store\assets"

function Shot($name) {
  & $adb shell screencap -p /sdcard/ndv-shot.png
  & $adb pull /sdcard/ndv-shot.png "$out\$name" | Out-Null
  Add-Type -AssemblyName System.Drawing
  $bmp = [System.Drawing.Bitmap]::FromFile("$out\$name")
  $vals = @()
  for ($x = 0; $x -lt $bmp.Width; $x += 40) {
    for ($y = 0; $y -lt $bmp.Height; $y += 40) {
      $p = $bmp.GetPixel($x, $y)
      $vals += ($p.R + $p.G + $p.B) / 3
    }
  }
  $avg = ($vals | Measure-Object -Average).Average
  $min = ($vals | Measure-Object -Minimum).Minimum
  $max = ($vals | Measure-Object -Maximum).Maximum
  $bmp.Dispose()
  Write-Output ("{0}: avg={1:N1} min={2:N0} max={3:N0}" -f $name, $avg, $min, $max)
}

& $adb logcat -c
Write-Output "=== 1. HOME (initial) ==="
Shot "emu-test-1-home.png"

Write-Output "=== 2. HOME scrolled down ==="
& $adb shell input swipe 540 1700 540 700 400
Start-Sleep -Seconds 3
Shot "emu-test-2-home-scrolled.png"

Write-Output "=== 3. Tap product (grid area) ==="
& $adb shell input swipe 540 700 540 1700 400   # scroll back up
Start-Sleep -Seconds 2
& $adb shell input tap 540 900
Start-Sleep -Seconds 6
Shot "emu-test-3-product.png"

Write-Output "=== 4. BACK to home ==="
& $adb shell input keyevent 4
Start-Sleep -Seconds 3
Shot "emu-test-4-back.png"

Write-Output "=== 5. Background + resume ==="
& $adb shell input keyevent 3
Start-Sleep -Seconds 2
& $adb shell am start -n au.com.ndvluxury/.MainActivity
Start-Sleep -Seconds 6
Shot "emu-test-5-resume.png"

Write-Output "=== Errors in logcat ==="
& $adb logcat -d | Select-String -Pattern "FATAL|AndroidRuntime|CRASH" | Select-Object -First 10
Write-Output "=== Chromium console (last 20) ==="
& $adb logcat -d | Select-String -Pattern "chromium.*console|CONSOLE" | Select-Object -Last 20
