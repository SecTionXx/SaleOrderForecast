# Backup script for OrderForecast
$backupDir = "$PSScriptRoot\backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "orderforecast_backup_$timestamp"
$backupPath = "$backupDir\$backupName"

# Create backup directory if it doesn't exist
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Files and directories to backup
$filesToBackup = @(
    "index.html",
    "login.html",
    "style.css",
    "script.js",
    "js",
    "css",
    "backend/app"
)

# Create backup directory
New-Item -ItemType Directory -Path $backupPath | Out-Null

# Copy files
foreach ($item in $filesToBackup) {
    $source = Join-Path $PSScriptRoot $item
    $destination = Join-Path $backupPath $item
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $destination -Recurse -Force
        Write-Host "Backed up: $item"
    } else {
        Write-Host "Warning: $item not found, skipping..."
    }
}

# Create a zip of the backup
$zipFile = "$backupPath.zip"
Compress-Archive -Path $backupPath -DestinationPath $zipFile -Force

# Remove the uncompressed backup directory
Remove-Item -Path $backupPath -Recurse -Force

Write-Host "Backup completed successfully: $zipFile"
