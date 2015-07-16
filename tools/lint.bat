
@echo off
setlocal enabledelayedexpansion
set TOOLS_DIR=%~dp0
set LOGS_PATH=%TOOLS_DIR%logs
set SOURCE_PATH=%TOOLS_DIR%..\source
set TARGET=%1
pushd %SOURCE_PATH%
if NOT [%TARGET%]==[] (
	set LOGFILE=%LOGS_PATH%\lint-individual.log
	echo linting file %SOURCE_PATH%\%TARGET%
	echo logging in !LOGFILE!
	gjslint "%SOURCE_PATH%\%TARGET%" > "!LOGFILE!"

) else (
	set LOGFILE=%LOGS_PATH%\lint.log
	echo linting directory %SOURCE_PATH%
	echo logging in !LOGFILE!
	gjslint -r %SOURCE_PATH% > "!LOGFILE!"
	
)

type %LOGFILE%
popd
endlocal
