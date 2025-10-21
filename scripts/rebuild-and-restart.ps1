# ========================================
#  SafeWork Pro Rebuild & Restart Script
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SafeWork Pro Rebuild & Restart Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Store the root directory
$rootDir = Get-Location

# Step 1: Stop any running Node.js processes
Write-Host "[1/4] Stopping all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es). Stopping..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "Node.js processes stopped." -ForegroundColor Green
} else {
    Write-Host "Info: No Node.js processes were running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Waiting for processes to terminate..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Write-Host ""

# Step 2: Navigate to web directory and install dependencies
Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
Set-Location -Path "web"

if (Test-Path "package-lock.json") {
    Write-Host "Running npm ci for clean install..." -ForegroundColor Gray
    npm ci
} else {
    Write-Host "Running npm install..." -ForegroundColor Gray
    npm install
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Dependency installation failed!" -ForegroundColor Red
    Set-Location -Path $rootDir
    exit 1
}

Write-Host "Dependencies installed successfully." -ForegroundColor Green
Write-Host ""

# Step 3: Build the application
Write-Host "[3/4] Building application..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed!" -ForegroundColor Red
    Set-Location -Path $rootDir
    exit 1
}

Write-Host "Build completed successfully." -ForegroundColor Green
Write-Host ""

# Step 4: Start the application
Write-Host "[4/4] Starting application..." -ForegroundColor Yellow
Write-Host "The application will start on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run start

# Return to root directory when done
Set-Location -Path $rootDir