$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot "public"
$outputPath = Join-Path $outputDirectory "voiceover.wav"
$ssmlPath = Join-Path $projectRoot "voiceover.ssml"

New-Item -ItemType Directory -Force $outputDirectory | Out-Null
Add-Type -AssemblyName System.Speech

$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $speaker.Rate = 1
  $speaker.SetOutputToWaveFile($outputPath)
  $speaker.SpeakSsml((Get-Content -Raw $ssmlPath))
} finally {
  $speaker.Dispose()
}

Write-Output "Generated $outputPath"
