@echo off
REM ============================================================================
REM  WHAT THIS FILE DOES (in simple words)
REM
REM  Your website sends contact messages through a small program that runs on
REM  Cloudflare (a service that runs it for you). The code of that program is
REM  the file  worker\index.js  on your computer.
REM
REM  When you change worker\index.js, NOTHING changes online until you upload
REM  it to Cloudflare. Double-click THIS file to upload it. That is all.
REM
REM  While uploading it also:
REM   - installs what it needs (only the first time),
REM   - asks you to log in to Cloudflare (only the first time),
REM   - keeps your 3 keys (Resend key, spam-check key, your email address).
REM     Always upload with this file: a normal upload erases those keys.
REM
REM  WHEN TO USE IT: only after you change worker\index.js.
REM  Changes to the website itself do not need it (GitHub does those by itself).
REM ============================================================================
setlocal
cd /d "%~dp0..\..\worker"

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
call node "%~dp0upload-mail-sender-keeping-keys.mjs"
if errorlevel 1 (
    echo.
    echo Deploy failed.
    pause
    exit /b 1
)

echo.
echo Done. Send a test message from the site to check it.
pause
