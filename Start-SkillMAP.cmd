@echo off
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" (
  "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" "%~dp0scripts\start-local.py"
) else (
  python "%~dp0scripts\start-local.py"
)
if errorlevel 1 pause
