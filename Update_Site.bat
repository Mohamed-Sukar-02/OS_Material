@echo off
echo =======================================================
echo          StudyVault - Updater
echo =======================================================
echo.
echo Scanning 'files' folder for updates...
echo.

powershell -ExecutionPolicy Bypass -NoProfile -Command "& { Set-Location -Path '%~dp0'; .\build.ps1 }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Something went wrong!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Update successful! Opening the site...
echo =======================================================
timeout /t 2 > nul

start "" "%~dp0index.html"
