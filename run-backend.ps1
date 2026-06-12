# ============================================================
# LifeOS AI - backend launcher (Windows / PowerShell)
#
# Loads variables from .env into the process environment and starts the
# backend on the zero-dependency H2 'local' profile. Spring Boot does not
# read .env on its own, so this script bridges that gap for local dev.
#
#   ./run-backend.ps1
# ============================================================
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $root ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $idx = $line.IndexOf("=")
            $name = $line.Substring(0, $idx).Trim()
            $value = $line.Substring($idx + 1).Trim().Trim('"')
            if ($name) {
                [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
    Write-Host ".env loaded." -ForegroundColor Green
    if ([string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) {
        Write-Host "Note: OPENAI_API_KEY is empty -> AI features will return 503." -ForegroundColor Yellow
    } else {
        Write-Host "AI key detected -> assistant enabled." -ForegroundColor Green
    }
} else {
    Write-Host "No .env found; using defaults (AI disabled)." -ForegroundColor Yellow
}

Set-Location (Join-Path $root "backend")
mvn -q -DskipTests spring-boot:run "-Dspring-boot.run.profiles=local"
