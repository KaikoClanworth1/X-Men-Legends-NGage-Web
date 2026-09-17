@echo off
rem Starts a local web server for X-Men Legends Web and opens it in the default browser.
rem Put your assets.pkg next to this file (or choose it in the page).
setlocal
cd /d "%~dp0"
set PORT=8770

set PY=
where python >nul 2>nul && set PY=python
if not defined PY where py >nul 2>nul && set PY=py -3
if not defined PY (
  echo Python 3 is required: https://www.python.org/downloads/
  pause
  exit /b 1
)

start "" "http://localhost:%PORT%/"
echo Serving on http://localhost:%PORT%/  - close this window to stop.
%PY% -m http.server %PORT%
