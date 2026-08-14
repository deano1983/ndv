# Store graphics: Play hi-res icon (512) + Play feature graphic (1024x500).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$Root = "$PSScriptRoot\.."
$Out = Join-Path $Root "store\assets"
New-Item -ItemType Directory -Path $Out -Force | Out-Null
$Noir = "#1A1616"; $Champagne = "#E8D5C4"

# --- 512 hi-res icon (from the 1024 master) ---
$icon = [System.Drawing.Image]::FromFile((Join-Path $Root "assets\icon-only.png"))
$i512 = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($i512)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($icon, 0, 0, 512, 512)
$i512.Save((Join-Path $Out "play-icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $i512.Dispose(); $icon.Dispose()
Write-Output "play-icon-512.png"

# --- 1024x500 feature graphic: noir base, monogram left, wordmark right ---
$fg = New-Object System.Drawing.Bitmap(1024, 500)
$g = [System.Drawing.Graphics]::FromImage($fg)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.ColorTranslator]::FromHtml($Noir))

$brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($Champagne))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#8C7B72"))
$display = New-Object System.Drawing.Font("Georgia", 96, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tag = New-Object System.Drawing.Font("Georgia", 28, [System.Drawing.FontStyle]::Italic, [System.Drawing.GraphicsUnit]::Pixel)

# monogram block
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("NDV", $display, $brush, 60, 150)
$pen = New-Object System.Drawing.Pen($brush, 3)
$g.DrawLine($pen, 60, 300, 260, 300)
# wordmark block
$g.DrawString("Neurodivergence", $display, $brush, 300, 150)
$g.DrawString("Luxury for the sensitive woman.", $tag, $muted, 304, 300)

$fg.Save((Join-Path $Out "play-feature-1024x500.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$pen.Dispose(); $display.Dispose(); $tag.Dispose(); $brush.Dispose(); $muted.Dispose(); $g.Dispose(); $fg.Dispose()
Write-Output "play-feature-1024x500.png"
