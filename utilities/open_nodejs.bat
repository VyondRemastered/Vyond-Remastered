:: opens node.js in a standalone batch so that i can use a tool that silently runs batch files
:: this is stupid
:: please help
@echo off
pushd "%~dp0"
title NODE.JS HASN'T STARTED YET

:: Load current settings
if "%SUBSCRIPT%"=="" ( 
	set SUBSCRIPT=y
	call config.bat
	set "SUBSCRIPT="
) else (
	call config.bat
)

if %USEGA4SR%==n ( pushd .. ) else ( pushd ..\ga4sr )

:::::::::::::::::::
:: Node.js stuff ::
:::::::::::::::::::

:: start vyond
if not exist node_modules ( npm install && npm test ) else ( npm test )