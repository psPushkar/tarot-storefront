@echo off
REM ── Tarot storefront demos ────────────────────────────────────────────────
REM Serves all five designs over http://localhost so previews, fonts and
REM navigation behave exactly as they would on a real site. Opening the HTML
REM files directly also works, but some browsers restrict embedded previews on
REM file:// URLs, so this is the reliable way to show a customer.

cd /d "%~dp0"

echo.
echo   Aurelia Sable - five storefront designs
echo   ---------------------------------------
echo   Starting a local server on http://localhost:8900
echo.
echo   Your browser should open automatically.
echo   Leave this window open while you are demoing.
echo   Press Ctrl+C here when you are finished.
echo.

start "" "http://localhost:8900/index.html"

python -m http.server 8900 --bind 127.0.0.1 2>nul
if errorlevel 1 (
  echo.
  echo   Could not start the server with "python".
  echo   Trying "py" instead...
  echo.
  py -m http.server 8900 --bind 127.0.0.1
)
