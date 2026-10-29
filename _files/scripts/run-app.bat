@echo off
REM ============================================================================
REM  WHAT THIS FILE DOES (in simple words)
REM
REM  It starts your website on YOUR computer, so you can look at it and test
REM  changes before anything goes online. Double-click this file to start it.
REM
REM  What happens:
REM   - the first time, it installs what the website needs (this takes a minute),
REM   - then it starts the website. Open  http://localhost:1337  in your browser.
REM     (If that port is busy, the window shows the address it used instead.)
REM   - every change you save in the website files shows up in the browser by
REM     itself, you do not have to restart.
REM
REM  To stop the website: close the window, or press Ctrl+C in it.
REM
REM  This does NOT put anything online. The live website is updated by GitHub
REM  when you push your changes. It also does NOT touch the mail sender on
REM  Cloudflare: for that use upload-mail-sender-to-cloudflare.bat.
REM ============================================================================
setlocal
cd /d "%~dp0..\..\website"

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

echo Starting dev server...
call npm run dev

pause
