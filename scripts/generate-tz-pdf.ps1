$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot "docs\TZ_MVP_SHOPCAP.md"
$htmlPath = Join-Path $repoRoot "docs\ShopCAP_TZ_GOST19.html"
$pdfPath = Join-Path $repoRoot "docs\ShopCAP_TZ_GOST19.pdf"

if (-not (Test-Path $sourcePath)) {
    throw "Source markdown not found: $sourcePath"
}

function Convert-InlineMarkdownToHtml {
    param([string]$Text)

    $encoded = [System.Net.WebUtility]::HtmlEncode($Text)
    $encoded = [regex]::Replace($encoded, '\*\*(.+?)\*\*', '<strong>$1</strong>')
    $encoded = [regex]::Replace($encoded, '`([^`]+)`', '<code>$1</code>')
    return $encoded
}

function Close-OpenLists {
    param([ref]$InUl, [ref]$InOl)
    $closing = New-Object System.Collections.Generic.List[string]

    if ($InUl.Value) {
        $closing.Add("</ul>") | Out-Null
        $InUl.Value = $false
    }

    if ($InOl.Value) {
        $closing.Add("</ol>") | Out-Null
        $InOl.Value = $false
    }

    return $closing
}

$lines = Get-Content -LiteralPath $sourcePath -Encoding UTF8
$body = New-Object System.Collections.Generic.List[string]
$inUl = $false
$inOl = $false

foreach ($line in $lines) {
    $raw = [string]$line
    $trimmed = $raw.Trim()

    if ($trimmed -eq "") {
        $closed = Close-OpenLists ([ref]$inUl) ([ref]$inOl)
        foreach ($item in $closed) {
            $body.Add($item) | Out-Null
        }
        continue
    }

    if ($trimmed.StartsWith("# ")) {
        $closed = Close-OpenLists ([ref]$inUl) ([ref]$inOl)
        foreach ($item in $closed) {
            $body.Add($item) | Out-Null
        }
        $content = Convert-InlineMarkdownToHtml ($trimmed.Substring(2))
        $body.Add("<h1>$content</h1>") | Out-Null
        continue
    }

    if ($trimmed.StartsWith("## ")) {
        $closed = Close-OpenLists ([ref]$inUl) ([ref]$inOl)
        foreach ($item in $closed) {
            $body.Add($item) | Out-Null
        }
        $content = Convert-InlineMarkdownToHtml ($trimmed.Substring(3))
        $body.Add("<h2>$content</h2>") | Out-Null
        continue
    }

    if ($trimmed.StartsWith("### ")) {
        $closed = Close-OpenLists ([ref]$inUl) ([ref]$inOl)
        foreach ($item in $closed) {
            $body.Add($item) | Out-Null
        }
        $content = Convert-InlineMarkdownToHtml ($trimmed.Substring(4))
        $body.Add("<h3>$content</h3>") | Out-Null
        continue
    }

    if ($trimmed.StartsWith("- ")) {
        if ($inOl) {
            $body.Add("</ol>") | Out-Null
            $inOl = $false
        }
        if (-not $inUl) {
            $body.Add("<ul>") | Out-Null
            $inUl = $true
        }
        $content = Convert-InlineMarkdownToHtml ($trimmed.Substring(2))
        $body.Add("<li>$content</li>") | Out-Null
        continue
    }

    if ($trimmed -match '^[0-9]+\.\s+(.+)$') {
        if ($inUl) {
            $body.Add("</ul>") | Out-Null
            $inUl = $false
        }
        if (-not $inOl) {
            $body.Add("<ol>") | Out-Null
            $inOl = $true
        }
        $content = Convert-InlineMarkdownToHtml ($matches[1])
        $body.Add("<li>$content</li>") | Out-Null
        continue
    }

    $closed = Close-OpenLists ([ref]$inUl) ([ref]$inOl)
    foreach ($item in $closed) {
        $body.Add($item) | Out-Null
    }

    $content = Convert-InlineMarkdownToHtml $trimmed
    $body.Add("<p>$content</p>") | Out-Null
}

$closed = Close-OpenLists ([ref]$inUl) ([ref]$inOl)
foreach ($item in $closed) {
    $body.Add($item) | Out-Null
}

$html = @"
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ShopCAP - Техническое задание</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 25mm;
    }

    body {
      font-family: "Times New Roman", serif;
      font-size: 14pt;
      line-height: 1.45;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .document {
      max-width: 100%;
      margin: 0 auto;
    }

    h1, h2, h3 {
      font-weight: 700;
      margin-top: 18pt;
      margin-bottom: 10pt;
      page-break-after: avoid;
    }

    h1 {
      text-align: center;
      font-size: 18pt;
      margin-top: 0;
      margin-bottom: 18pt;
    }

    h2 {
      font-size: 16pt;
    }

    h3 {
      font-size: 14pt;
    }

    p {
      margin: 0 0 10pt 0;
      text-align: justify;
      text-indent: 1.25cm;
    }

    ul, ol {
      margin: 0 0 10pt 1.2cm;
      padding-left: 0.6cm;
    }

    li {
      margin: 0 0 6pt 0;
      text-align: justify;
    }

    code {
      font-family: "Courier New", monospace;
      font-size: 12pt;
      background: #f3f4f6;
      padding: 0 4px;
      border-radius: 3px;
    }

    strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="document">
    $($body -join "`n")
  </div>
</body>
</html>
"@

Set-Content -LiteralPath $htmlPath -Value $html -Encoding UTF8

$browserCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($null -eq $browser) {
    throw "No supported browser found for PDF generation."
}

$htmlUri = [Uri]::new($htmlPath).AbsoluteUri

if (Test-Path $pdfPath) {
    Remove-Item -LiteralPath $pdfPath -Force
}

& $browser `
    --headless=new `
    --disable-gpu `
    --allow-file-access-from-files `
    --print-to-pdf="$pdfPath" `
    --print-to-pdf-no-header `
    "$htmlUri" | Out-Null

if (-not (Test-Path $pdfPath)) {
    throw "PDF was not generated: $pdfPath"
}

Write-Output "HTML_CREATED: $htmlPath"
Write-Output "PDF_CREATED: $pdfPath"
