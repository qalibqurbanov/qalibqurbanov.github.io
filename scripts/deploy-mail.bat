@echo off
setlocal
cd /d "%~dp0..\worker"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed.
        pause
        exit /b 1
    )
)

echo Checking the Cloudflare login...
call npx wrangler whoami 2>&1 | findstr /C:"not authenticated" >nul
if not errorlevel 1 (
    echo Not logged in to Cloudflare. A browser window opens: log in and click Allow.
    call npx wrangler login
    if errorlevel 1 (
        echo.
        echo Cloudflare login failed.
        pause
        exit /b 1
    )
)

echo Deploying the mail Cloudflare Worker...
call npm run deploy
if errorlevel 1 (
    echo.
    echo Deploy failed.
    pause
    exit /b 1
)

echo.
echo Done. Send a test message from the site to check it.
pause
