$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot "docs\TZ_MVP_SHOPCAP.md"
$outputPath = Join-Path $repoRoot "docs\ShopCAP_TZ_GOST19.docx"
$downloadsDir = Join-Path $env:USERPROFILE "Downloads"

if (-not (Test-Path $sourcePath)) {
    throw "Source markdown not found: $sourcePath"
}

$template = Get-ChildItem -Path $downloadsDir -Filter *.docx -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $template) {
    throw "No DOCX template found in: $downloadsDir"
}

Copy-Item -LiteralPath $template.FullName -Destination $outputPath -Force

function Escape-XmlText {
    param([string]$Text)
    if ($null -eq $Text) { return "" }
    return [System.Security.SecurityElement]::Escape($Text)
}

function Normalize-MarkdownText {
    param([string]$Text)
    $value = $Text.Trim()
    $value = $value -replace "\*\*", ""
    $value = $value -replace "__", ""
    $value = $value.Replace([string][char]96, "")
    return $value
}

function New-Run {
    param(
        [string]$Text,
        [bool]$Bold = $false,
        [int]$Size = 28
    )

    $escaped = Escape-XmlText $Text
    $boldXml = ""
    if ($Bold) {
        $boldXml = "<w:b/><w:bCs/>"
    }

    return @"
<w:r>
  <w:rPr>
    <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
    $boldXml
    <w:sz w:val="$Size"/>
    <w:szCs w:val="$Size"/>
  </w:rPr>
  <w:t xml:space="preserve">$escaped</w:t>
</w:r>
"@
}

function New-Paragraph {
    param(
        [string]$Text = "",
        [string]$Align = "both",
        [int]$FirstLine = 709,
        [int]$Left = 0,
        [int]$Before = 0,
        [int]$After = 60,
        [int]$Line = 360,
        [bool]$Bold = $false,
        [int]$Size = 28
    )

    $runXml = ""
    if ($Text -ne "") {
        $runXml = New-Run -Text $Text -Bold:$Bold -Size $Size
    }

    return @"
<w:p>
  <w:pPr>
    <w:spacing w:before="$Before" w:after="$After" w:line="$Line" w:lineRule="auto"/>
    <w:ind w:firstLine="$FirstLine" w:left="$Left"/>
    <w:jc w:val="$Align"/>
  </w:pPr>
  $runXml
</w:p>
"@
}

function New-PageBreak {
    return @"
<w:p>
  <w:r>
    <w:br w:type="page"/>
  </w:r>
</w:p>
"@
}

$lines = Get-Content -LiteralPath $sourcePath -Encoding UTF8
$paragraphs = New-Object System.Collections.Generic.List[string]
$titleHandled = $false

foreach ($line in $lines) {
    $trimmed = ([string]$line).Trim()

    if ($trimmed -eq "") {
        $paragraphs.Add((New-Paragraph -Text "" -Align "left" -FirstLine 0 -After 40 -Line 240)) | Out-Null
        continue
    }

    if ($trimmed.StartsWith("# ")) {
        $text = Normalize-MarkdownText ($trimmed.Substring(2))
        $paragraphs.Add((New-Paragraph -Text $text -Align "center" -FirstLine 0 -After 120 -Line 240 -Bold $true -Size 32)) | Out-Null
        if (-not $titleHandled) {
            $paragraphs.Add((New-Paragraph -Text "ShopCAP MVP technical assignment document" -Align "center" -FirstLine 0 -After 120 -Line 240 -Size 28)) | Out-Null
            $paragraphs.Add((New-Paragraph -Text "Generated from the repository specification" -Align "center" -FirstLine 0 -After 120 -Line 240 -Size 28)) | Out-Null
            $paragraphs.Add((New-PageBreak)) | Out-Null
            $titleHandled = $true
        }
        continue
    }

    if ($trimmed.StartsWith("## ")) {
        $text = Normalize-MarkdownText ($trimmed.Substring(3))
        $paragraphs.Add((New-Paragraph -Text $text -Align "left" -FirstLine 0 -Before 120 -After 120 -Line 240 -Bold $true -Size 30)) | Out-Null
        continue
    }

    if ($trimmed.StartsWith("### ")) {
        $text = Normalize-MarkdownText ($trimmed.Substring(4))
        $paragraphs.Add((New-Paragraph -Text $text -Align "left" -FirstLine 0 -Before 60 -After 80 -Line 240 -Bold $true -Size 28)) | Out-Null
        continue
    }

    if ($trimmed.StartsWith("- ")) {
        $text = Normalize-MarkdownText $trimmed
        $paragraphs.Add((New-Paragraph -Text $text -Align "both" -FirstLine 0 -Left 709 -After 40 -Line 360 -Size 28)) | Out-Null
        continue
    }

    if ($trimmed -match "^[0-9]+\.\s+") {
        $text = Normalize-MarkdownText $trimmed
        $paragraphs.Add((New-Paragraph -Text $text -Align "both" -FirstLine 0 -Left 709 -After 40 -Line 360 -Size 28)) | Out-Null
        continue
    }

    $text = Normalize-MarkdownText $trimmed
    $paragraphs.Add((New-Paragraph -Text $text -Align "both" -FirstLine 709 -After 60 -Line 360 -Size 28)) | Out-Null
}

$bodyXml = ($paragraphs -join "`n")
$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
$bodyXml
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>
      <w:pgNumType w:fmt="decimal"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($outputPath, [System.IO.Compression.ZipArchiveMode]::Update)

try {
    $existingEntry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" } | Select-Object -First 1
    if ($null -ne $existingEntry) {
        $existingEntry.Delete()
    }

    $newEntry = $zip.CreateEntry("word/document.xml")
    $stream = $newEntry.Open()
    $writer = New-Object System.IO.StreamWriter($stream, [System.Text.UTF8Encoding]::new($false))
    $writer.Write($documentXml)
    $writer.Flush()
    $writer.Dispose()
} finally {
    $zip.Dispose()
}

Write-Output "DOCX_CREATED: $outputPath"
