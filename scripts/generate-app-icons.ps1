$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectDirectory = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $projectDirectory 'docs/assets/icono-ksm-original.png'
$iconDirectory = Join-Path $projectDirectory 'public/icons'
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

try {
    if ($sourceImage.Width -ne $sourceImage.Height) {
        throw 'El icono original debe ser cuadrado.'
    }
    foreach ($size in @(16, 32, 128, 180, 192, 256, 384, 512)) {
        $bitmap = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
            $bitmap.Save((Join-Path $iconDirectory "ksm-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
    Copy-Item -LiteralPath (Join-Path $iconDirectory 'ksm-512.png') -Destination (Join-Path $iconDirectory 'ksm-maskable-512.png')
}
finally {
    $sourceImage.Dispose()
}
Write-Output 'Iconos KSM generados para navegador, iOS y Android.'
