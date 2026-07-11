@echo off
setlocal
REM ── Publish Lumina to a private GitHub repo (dnh33/lumina) ──────────
REM Uses your PC's existing GitHub login. Run by double-clicking, or:
REM   scripts\publish-to-github.bat

cd /d "%~dp0.."

where gh >nul 2>nul
if %errorlevel%==0 (
  echo Using GitHub CLI...
  gh repo create dnh33/lumina --private --source . --remote origin --push
  if %errorlevel%==0 (
    echo.
    echo Done! Private repo live at https://github.com/dnh33/lumina
    pause
    exit /b 0
  )
  echo gh failed - falling back to plain git...
)

echo.
echo Opening github.com/new - create a PRIVATE repo named "lumina"
echo (no README, no .gitignore - the repo already has everything).
start "" "https://github.com/new?name=lumina&visibility=private"
echo.
pause

git remote remove origin >nul 2>nul
git remote add origin https://github.com/dnh33/lumina.git
git push -u origin main
if %errorlevel%==0 (
  echo.
  echo Done! Private repo live at https://github.com/dnh33/lumina
) else (
  echo.
  echo Push failed. Check that the repo exists and you're signed in to git.
)
pause
