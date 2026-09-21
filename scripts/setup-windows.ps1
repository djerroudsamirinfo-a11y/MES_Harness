#Requires -Version 5.1
<#
.SYNOPSIS
  Configuration initiale MES Harness sous Windows.
.DESCRIPTION
  Vérifie Node, prépare .env, installe dépendances, Prisma, seed, choisit un port libre.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "=== MES Harness — configuration Windows ===" -ForegroundColor Cyan
Write-Host "Répertoire : $Root"
Write-Host ""

# --- Node ---
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "ERREUR : Node.js n'est pas installé ou pas dans le PATH." -ForegroundColor Red
  Write-Host "Téléchargez LTS depuis https://nodejs.org/ puis relancez ce script." -ForegroundColor Yellow
  exit 1
}
$nodeVer = & node -v
Write-Host "Node détecté : $nodeVer"

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Host "ERREUR : npm introuvable." -ForegroundColor Red
  exit 1
}

# --- .env ---
$envExample = Join-Path $Root ".env.example"
$envFile = Join-Path $Root ".env"
if (-not (Test-Path $envFile)) {
  if (-not (Test-Path $envExample)) {
    Write-Host "ERREUR : .env.example manquant." -ForegroundColor Red
    exit 1
  }
  Copy-Item $envExample $envFile
  Write-Host "Fichier .env créé depuis .env.example"
} else {
  Write-Host ".env déjà présent — conservé"
}

# --- Port libre parmi 3001,3002,3003,3010 ---
function Test-PortFree([int]$Port) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    $listener.Stop()
    return $true
  } catch {
    return $false
  }
}

$candidates = @(3001, 3002, 3003, 3010)
$chosen = $null
foreach ($p in $candidates) {
  if (Test-PortFree $p) {
    $chosen = $p
    break
  }
  Write-Host "Port $p occupé — suivant…" -ForegroundColor DarkYellow
}
if (-not $chosen) {
  Write-Host "ERREUR : aucun port libre parmi $($candidates -join ', ')." -ForegroundColor Red
  exit 1
}
Write-Host "Port choisi : $chosen" -ForegroundColor Green

# Ecrire PORT dans .env (ligne par ligne — evite les bugs de quotes PowerShell 5.1)
$lines = @()
if (Test-Path $envFile) {
  $lines = @(Get-Content -Path $envFile)
}
$foundPort = $false
$newLines = @()
foreach ($line in $lines) {
  if ($line -match '^PORT=') {
    $newLines += ("PORT=" + $chosen)
    $foundPort = $true
  } else {
    $newLines += $line
  }
}
if (-not $foundPort) {
  $newLines += ("PORT=" + $chosen)
}
$newLines | Set-Content -Path $envFile -Encoding UTF8
Set-Content -Path (Join-Path $Root ".port") -Value ([string]$chosen) -NoNewline -Encoding ASCII
Write-Host ("PORT=" + $chosen + " ecrit dans .env et .port")

# --- npm install / prisma / seed ---
Write-Host ""
Write-Host "npm install…" -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "npx prisma generate…" -ForegroundColor Cyan
& npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "npx prisma db push…" -ForegroundColor Cyan
& npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "npm run db:seed…" -ForegroundColor Cyan
& npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Configuration terminée ===" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Cyan
Write-Host "  1. Lancer le serveur :"
Write-Host "       npm run dev"
Write-Host "     (équivalent : npx next dev -p $chosen)"
Write-Host "  2. Ouvrir http://localhost:$chosen"
Write-Host "  3. Connexion démo :"
Write-Host "       operateur@mes.local / oper123"
Write-Host "       admin@mes.local / admin123"
Write-Host ""
Write-Host "Mise à jour ultérieure :"
Write-Host "  git pull"
Write-Host "  npm install"
Write-Host "  npx prisma db push"
Write-Host "  npm run db:seed   # optionnel — réinitialise les données démo"
Write-Host "  npm run dev"
Write-Host ""
