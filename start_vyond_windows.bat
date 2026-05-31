:: Vyond: Remastered Launcher
:: License: MIT
set WRAPPER_VER=2.5.0
set OS_USED=Windows
set NODE_ENV=dev
title Vyond: Remastered v%WRAPPER_VER% [Initializing...]
::::::::::::::::::::
:: Initialization ::
::::::::::::::::::::

:: Stop commands from spamming stuff, cleans up the screen
@echo off && cls

:: Lets variables work or something idk im not a nerd
SETLOCAL ENABLEDELAYEDEXPANSION

:: Make sure we're starting in the correct folder, and that it worked (otherwise things would go horribly wrong)
pushd "%~dp0"
if !errorlevel! NEQ 0 goto error_location
if not exist utilities ( goto error_location )
if not exist wrapper ( goto error_location )
if not exist server ( goto error_location )
goto noerror_location
:error_location
echo Doesn't seem like this script is in a Vyond: Remastered folder.
pause && exit
:noerror_location

:: patch detection
if exist "patch.jpg" goto patched

:: Prevents CTRL+C cancelling (please close with 0) and keeps window open when crashing
if "%~1" equ "point_insertion" goto point_insertion
start "" /wait /B "%~F0" point_insertion
exit

:point_insertion

:: Check *again* because it seems like sometimes it doesn't go into dp0 the first time???
pushd "%~dp0"
if !errorlevel! NEQ 0 goto error_location
if not exist utilities ( goto error_location )
if not exist wrapper ( goto error_location )
if not exist server ( goto error_location )

:: Create checks folder if nonexistent
if not exist "utilities\checks" md utilities\checks

:: Operator, attention!
if not exist "utilities\checks\disclaimer.txt" (
	:: only agree to the terms if vyond remastered was given to the user and not in development. (Helps out some devs working with this project)
	if %NODE_ENV%==production (
		echo DISCLAIMER
		echo:
	    echo Vyond Remastered is a project made by David to give people the ability to use the LVM freely with the business themes and no charge whatsoever.
	    echo By using this product, you agree to the terms and conditions, which you must read before using the software.
	    echo all of the devs, MJ, David and BluePeacocks think that use of this software is justified.
	    echo:
	    echo I, David, do not promote piracy whatsoever, I just want people to feel free to use business friendly and the non business themes without having to pay.
	    echo:
	    echo Excluding Adobe Flash and GoAnimate Inc's assets, Vyond: Remastered is free/libre software.
	    echo You are free to redistribute and/or modify it under the terms of the MIT ^(aka Expat^) license,
	    echo except for some dependencies which have different licenses with slightly different rights.
	    echo Read the LICENSE file in Vyond Remastered's base folder and the licenses in utilities/sourcecode for more info.
	    echo:
	    echo By continuing to use Vyond: Remastered, you acknowledge the nature of this project, and your right to use it.
	    echo If you object to any of this, feel free to close Vyond: Remastered now.
	    echo You will be allowed to accept 20 seconds after this message has appeared.
	    echo: 
	    timeout 20>nul
		echo If you still want to use Vyond: Remastered, press Y. If you no longer want to, press N.
		:disclaimacceptretry
		set /p ACCEPTCHOICE= Response:
		echo:
		if not '!acceptchoice!'=='' set acceptchoice=%acceptchoice:~0,1%
		if /i "!acceptchoice!"=="y" goto disclaimaccepted
		if /i "!acceptchoice!"=="n" exit
		goto disclaimacceptretry
		:disclaimaccepted
		echo: 
		echo Sorry for all the legalese, let's get back on track.
		echo You've accepted the disclaimer. To reread it, remove this file. > utilities\checks\disclaimer.txt
	)
)

:: Welcome, Director Ford!
echo Vyond: Remastered
echo A project from Davids Creation adapted by The Vyond Remastered Team
echo Version !WRAPPER_VER!
echo:

:: Confirm measurements to proceed.
set SUBSCRIPT=y
echo Loading settings...
if not exist utilities\config.bat ( goto configmissing )
call utilities\config.bat
echo:
if %VERBOSEWRAPPER%==y ( set vbwrapper=ON && set vbwrapperColor=green && echo Verbose mode activated. && echo:) else ( set vbwrapper=OFF && set vbwrapperColor=red )
goto configavailable

:: Restore config
:configmissing
echo Settings dosen't exist. Creating...
goto configcopy
:returnfromconfigcopy
if not exist utilities\config.bat ( echo Something is horribly wrong. You may be in a read-only system/admin folder. & pause & exit )
call utilities\config.bat
:configavailable

::::::::::::::::::::::
:: Dependency Check ::
::::::::::::::::::::::

if !SKIPCHECKDEPENDS!==y (
      set dpends=OFF
      set dpendsColor=red
	echo Checking dependencies has been skipped.
	echo:
	goto skip_dependency_install
) else ( set dpends=ON && set dpendsColor=green )

if %VERBOSEWRAPPER%==n (
	echo Checking for dependencies...
	echo:
)

title Vyond: Remastered v!WRAPPER_VER! [Checking dependencies...]

:: Preload variables
set NEEDTHEDEPENDERS=n
set ADMINREQUIRED=n
set FLASH_DETECTED=n
set FLASH_CHROMIUM_DETECTED=n
set FLASH_FIREFOX_DETECTED=n
set NODEJS_DETECTED=n
set HTTPSERVER_DETECTED=n
set HTTPSCERT_DETECTED=n
if !INCLUDEDCHROMIUM!==y set BROWSER_TYPE=chrome

:: Flash Player
if %VERBOSEWRAPPER%==y ( echo Checking for Flash installation... )
if exist "!windir!\SysWOW64\Macromed\Flash\*pepper.exe" set FLASH_CHROMIUM_DETECTED=y
if exist "!windir!\System32\Macromed\Flash\*pepper.exe" set FLASH_CHROMIUM_DETECTED=y
if exist "!windir!\SysWOW64\Macromed\Flash\*plugin.exe" set FLASH_FIREFOX_DETECTED=y
if exist "!windir!\System32\Macromed\Flash\*plugin.exe" set FLASH_FIREFOX_DETECTED=y
if !BROWSER_TYPE!==chrome (
	if !FLASH_CHROMIUM_DETECTED!==n (
		echo Flash for Chrome could not be found.
		echo:
		set NEEDTHEDEPENDERS=y
		set ADMINREQUIRED=y
		goto flash_checked
	) else (
		echo Flash is installed.
		echo:
		set FLASH_DETECTED=y
		goto flash_checked
	)
)
if !BROWSER_TYPE!==firefox (
	if !FLASH_FIREFOX_DETECTED!==n (
		echo Flash for Firefox could not be found.
		echo:
		set NEEDTHEDEPENDERS=y
		set ADMINREQUIRED=y
		goto flash_checked
	) else (
		echo Flash is installed.
		echo:
		set FLASH_DETECTED=y
		goto flash_checked
	)
)
:: just assume chrome it's what everyone uses
if !BROWSER_TYPE!==n (
	if !FLASH_CHROMIUM_DETECTED!==n (
		echo Flash for Chrome could not be found.
		echo:
		set NEEDTHEDEPENDERS=y
		set ADMINREQUIRED=y
		goto flash_checked
	) else (
		echo Flash is installed.
		echo:
		set FLASH_DETECTED=y
		goto flash_checked
	)
)
:flash_checked

:: Node.js
if %VERBOSEWRAPPER%==y ( echo Checking for Node.js installation... )
for /f "delims=" %%i in ('npm -v 2^>nul') do set output=%%i
IF "!output!" EQU "" (
	echo Node.js could not be found.
	echo:
	set NEEDTHEDEPENDERS=y
	set ADMINREQUIRED=y
	goto httpserver_checked
) else (
	echo Node.js is installed.
	echo:
	set NODEJS_DETECTED=y
)
:nodejs_checked

:: http-server
if %VERBOSEWRAPPER%==y ( echo Checking for http-server installation... )
npm list -g | findstr "http-server" >nul
if !errorlevel! == 0 (
	echo http-server is installed.
	echo:
	set HTTPSERVER_DETECTED=y
) else (
	echo http-server could not be found.
	echo:
	set NEEDTHEDEPENDERS=y
)
:httpserver_checked

:: HTTPS cert
if %VERBOSEWRAPPER%==y ( echo Checking for HTTPS certificate... )
certutil -store -enterprise root | findstr "WOCRTV3" >nul
if !errorlevel! == 0 (
	echo HTTPS cert installed.
	echo:
	set HTTPSCERT_DETECTED=y
) else (
	:: backup check in case non-admin method used
	if exist "utilities\checks\httpscert.txt" (
		echo HTTPS cert probably installed.
		echo:
		set HTTPSCERT_DETECTED=y
	) else (
		echo HTTPS cert could not be found.
		echo:
		set NEEDTHEDEPENDERS=y
	)
)
popd

:: Assumes nothing is installed during a dry run
if !DRYRUN!==y (
	echo Let's just ignore anything we just saw above.
	echo Nothing was found. Nothing exists. It's all fake.
	set NEEDTHEDEPENDERS=y
	set ADMINREQUIRED=y
	set FLASH_DETECTED=n
	set FLASH_CHROMIUM_DETECTED=n
	set FLASH_FIREFOX_DETECTED=n
	set NODEJS_DETECTED=n
	set HTTPSERVER_DETECTED=n
	set HTTPSCERT_DETECTED=n
	set BROWSER_TYPE=n
)

::::::::::::::::::::::::
:: Dependency Install ::
::::::::::::::::::::::::

if !NEEDTHEDEPENDERS!==y (
	if !SKIPDEPENDINSTALL!==n (
		echo:
		echo Installing missing dependencies...
		echo:
	) else (
		echo Skipping dependency install.
		goto skip_dependency_install
	)
) else (
	echo All dependencies are available.
	echo Turning off checking dependencies...
	echo:
	:: Initialize vars
	set CFG=utilities\config.bat
	set TMPCFG=utilities\tempconfig.bat
	:: Loop through every line until one to edit
	if exist !tmpcfg! del !tmpcfg!
	set /a count=1
	for /f "tokens=1,* delims=0123456789" %%a in ('find /n /v "" ^< !cfg!') do (
		set "line=%%b"
		>>!tmpcfg! echo(!line:~1!
		set /a count+=1
		if !count! GEQ 14 goto linereached
	)
	:linereached
	:: Overwrite the original setting
	echo set SKIPCHECKDEPENDS=y>> !tmpcfg!
	echo:>> !tmpcfg!
	:: Print the last of the config to our temp file
	more +15 !cfg!>> !tmpcfg!
	:: Make our temp file the normal file
	copy /y !tmpcfg! !cfg! >nul
	del !tmpcfg!
	:: Set in this script
	set SKIPCHECKDEPENDS=y
	goto skip_dependency_install
)

title Vyond: Remastered v!WRAPPER_VER! [Installing dependencies...]

:: Preload variables
set INSTALL_FLAGS=ALLUSERS=1 /norestart
set SAFE_MODE=n
if /i "!SAFEBOOT_OPTION!"=="MINIMAL" set SAFE_MODE=y
if /i "!SAFEBOOT_OPTION!"=="NETWORK" set SAFE_MODE=y
set CPU_ARCHITECTURE=what
if /i "!processor_architecture!"=="x86" set CPU_ARCHITECTURE=32
if /i "!processor_architecture!"=="AMD64" set CPU_ARCHITECTURE=64
if /i "!PROCESSOR_ARCHITEW6432!"=="AMD64" set CPU_ARCHITECTURE=64

:: Check for admin if installing Flash or Node.js
:: Skipped in Safe Mode, just in case anyone is running Vyond Remastered in safe mode... for some reason
:: and also because that was just there in the code i used for this and i was like "eh screw it why remove it"
if !ADMINREQUIRED!==y (
	if %VERBOSEWRAPPER%==y ( echo Checking for Administrator rights... && echo:)
	if /i not "!SAFE_MODE!"=="y" (
		fsutil dirty query !systemdrive! >NUL 2>&1
		if /i not !ERRORLEVEL!==0 (
			color cf
			if %VERBOSEWRAPPER%==n ( cls )
			echo:
			echo ERROR
			echo:
			if !FLASH_DETECTED!==n (
				if !NODEJS_DETECTED!==n (
					echo Vyond: Remastered needs to install Flash and Node.js.
				) else (
					echo Vyond: Remastered needs to install Flash.
				)
			) else (
				echo Vyond: Remastered needs to install Node.js.
			)
			echo To do this, it must be started with Admin rights.
			echo:
			echo Close this window and re-open Vyond: Remastered as an Admin.
			echo ^(right-click start_vyond.bat and click "Run as Administrator"^)
			echo:
			if !DRYRUN!==y (
				echo ...yep, dry run is going great so far, let's skip the exit
				pause
				goto postadmincheck
			)
			pause
			exit
		)
	)
	if %VERBOSEWRAPPER%==y ( echo Admin rights detected. && echo:)
)
:postadmincheck

:: Flash Player
if !FLASH_DETECTED!==n (
	:start_flash_install
	echo Installing Flash Player...
	echo:
	if !BROWSER_TYPE!==n (
		:: Ask what type of browser is being used.
		echo What web browser do you use? If it isn't here,
		echo look up whether it's based on Chromium or Firefox.
		echo If it's not based on either, then
		echo Vyond Remastered will not be able to install Flash.
		echo Unless you know what you're doing and have a
		echo version of Flash made for your browser, please
		echo install a Chrome or Firefox based browser.
		echo:
		echo Enter 1 for Chrome
		echo Enter 2 for Firefox
		echo Enter 3 for Edge
		echo Enter 4 for Opera
		echo Enter 5 for Brave
		echo Enter 6 for Chrome-based browser
		echo Enter 7 for Firefox-based browser
		echo Enter 0 for a non-standard browser ^(skips install^)
		:browser_ask
		set /p FLASHCHOICE=Response:
		echo:
		if "!flashchoice!"=="1" goto chromium_chosen
		if "!flashchoice!"=="2" goto firefox_chosen
		if "!flashchoice!"=="3" goto chromium_chosen
		if "!flashchoice!"=="4" goto chromium_chosen
		if "!flashchoice!"=="5" goto chromium_chosen
		if "!flashchoice!"=="6" goto chromium_chosen
		if "!flashchoice!"=="7" goto firefox_chosen
		if "!flashchoice!"=="0" echo Flash will not be installed.&& goto after_flash_install
		echo You must pick a browser.&& goto browser_ask

		:chromium_chosen
		set BROWSER_TYPE=chrome && if %VERBOSEWRAPPER%==y ( echo Chromium-based browser picked. && echo:) && goto escape_browser_ask

		:firefox_chosen
		set BROWSER_TYPE=firefox && if %VERBOSEWRAPPER%==y ( echo Firefox-based browser picked. ) && goto escape_browser_ask
	)

	:escape_browser_ask
	echo To install Flash Player, Vyond: Remastered must kill any currently running web browsers.
	echo Please make sure any work in your browser is saved before proceeding.
	echo Vyond: Remastered will not continue installation until you press a key.
	echo:
	pause
	echo:

	:: Summon the Browser Slayer
	if !DRYRUN!==y (
		echo The users brought down the batch script upon the Browser Slayer, and in his defeat entombed him in the unactivated code.
		goto lurebrowserslayer
	)
	echo Rip and tear, until it is done.
	for %%i in (firefox,palemoon,iexplore,microsoftedge,chrome,chrome64,opera,brave) do (
		if %VERBOSEWRAPPER%==y (
			 taskkill /f /im %%i.exe /t
			 wmic process where name="%%i.exe" call terminate
		) else (
			 taskkill /f /im %%i.exe /t >nul
			 wmic process where name="%%i.exe" call terminate >nul
		)
	)
	:lurebrowserslayer
	echo:

	if !BROWSER_TYPE!==chrome (
		echo Starting Flash for Chrome installer...
		if not exist "utilities\installers\flash_windows_chromium.msi" (
			echo ...erm. Bit of an issue there actually. The installer doesn't exist.
			echo A normal copy of Vyond: Remastered should come with one.
			echo You may be able to find a copy on this website:
			echo https://helpx.adobe.com/flash-player/kb/archived-flash-player-versions.html
			echo Although Flash is needed, Offline will continue launching.
			pause
		)
		if !DRYRUN!==n ( msiexec /i "utilities\installers\flash_windows_chromium.msi" !INSTALL_FLAGS! /quiet )
	)
	if !BROWSER_TYPE!==firefox (
		echo Starting Flash for Firefox installer...
		if not exist "utilities\installers\flash_windows_firefox.msi" (
			echo ...erm. Bit of an issue there actually. The installer doesn't exist.
			echo A normal copy of Vyond: Remastered should come with one.
			echo You may be able to find a copy on this website:
			echo https://helpx.adobe.com/flash-player/kb/archived-flash-player-versions.html
			echo Although Flash is needed, Vyond Remastered will try to install anything else it can.
			pause
			goto after_flash_install
		)
		if !DRYRUN!==n ( msiexec /i "utilities\installers\flash_windows_firefox.msi" !INSTALL_FLAGS! /quiet )
	)

	echo Flash has been installed.
	echo:
)
:after_flash_install

:: Node.js
if !NODEJS_DETECTED!==n (
	echo Installing Node.js...
	echo:
	:: Install Node.js
	if !CPU_ARCHITECTURE!==64 (
		if %VERBOSEWRAPPER%==y ( echo 64-bit system detected, installing 64-bit Node.js. )
		if not exist "utilities\installers\node_windows_x64.msi" (
			echo We have a problem. The 64-bit Node.js installer doesn't exist.
			echo A normal copy of Vyond: Remastered should come with one.
			echo You should be able to find a copy on this website:
			echo https://nodejs.org/en/download/
			echo Although Node.js is needed, Vyond Remastered will try to install anything else it can.
			pause
			goto after_nodejs_install
		)
		echo Proper Node.js installation doesn't seem possible to do automatically.
		echo You can just keep clicking next until it finishes, and Vyond: Remastered will continue once it closes.
		if !DRYRUN!==n ( msiexec /i "utilities\installers\node_windows_x64.msi" !INSTALL_FLAGS! )
		goto nodejs_installed
	)
	if !CPU_ARCHITECTURE!==32 (
		if %VERBOSEWRAPPER%==y ( echo 32-bit system detected, installing 32-bit Node.js. )
		if not exist "utilities\installers\node_windows_x32.msi" (
			echo We have a problem. The 32-bit Node.js installer doesn't exist.
			echo A normal copy of Vyond: Remastered should come with one.
			echo You should be able to find a copy on this website:
			echo https://nodejs.org/en/download/
			echo Although Node.js is needed, Offline will try to install anything else it can.
			pause
			goto after_nodejs_install
		)
		echo Proper Node.js installation doesn't seem possible to do automatically.
		echo You can just keep clicking next until it finishes, and Vyond : Remastered will continue once it closes.
		if !DRYRUN!==n ( msiexec /i "utilities\installers\node_windows_x32.msi" !INSTALL_FLAGS! )
		goto nodejs_installed
	)
	if !CPU_ARCHITECTURE!==what (
		echo:
		echo Well, this is a little embarassing.
		echo Vyond: Remastered can't tell if you're on a 32-bit or 64-bit system.
		echo Which means it doesn't know which version of Node.js to install...
		echo:
		echo If you have no idea what that means, press 1 to just try anyway.
		echo If you're in the future with newer architectures or something
		echo and you know what you're doing, then press 3 to keep going.
		echo:
		:architecture_ask
		set /p CPUCHOICE= Response:
		echo:
		if "!cpuchoice!"=="1" if !DRYRUN!==n ( msiexec /i "utilities\installers\node_windows_x32.msi" !INSTALL_FLAGS! ) && if %VERBOSEWRAPPER%==y ( echo Attempting 32-bit Node.js installation. ) && goto nodejs_installed
		if "!cpuchoice!"=="3" echo Node.js will not be installed. && goto after_nodejs_install
		echo You must pick one or the other.&& goto architecture_ask
	)
	:nodejs_installed
	echo Node.js has been installed.
	set NODEJS_DETECTED=y
	echo:
	goto install_cert
)
:after_nodejs_install

:: http-server
if !HTTPSERVER_DETECTED!==n (
	if !NODEJS_DETECTED!==y (
		echo Installing http-server...
		echo:

		:: Skip in dry run, not much use to run it
		if !DRYRUN!==y (
			echo ...actually, nah, let's skip this part.
			goto httpserverinstalled
		) 

		:: Attempt to install through NPM normally
		call npm install http-server -g

		:: Double check for installation
		echo Checking for http-server installation again...
		npm list -g | find "http-server" > nul
		if !errorlevel! == 0 (
			goto httpserverinstalled
		) else (
			echo:
			echo Online installation attempt failed. Trying again from local files...
			echo:
			if not exist "utilities\installers\http-server-master" (
				echo Well, we'd try that if the files existed.
				echo A normal copy of Vyond: Remastered should come with them.
				echo You should be able to find a copy on this website:
				echo https://www.npmjs.com/package/http-server
				echo Although http-server is needed, Vyond Remastered will try to install anything else it can.
				pause
				goto after_nodejs_install
			)
			call npm install utilities\installers\http-server-master -g
			goto triplecheckhttpserver
		)

		:: Triple check for installation
		echo Checking for http-server installation AGAIN...
		:triplecheckhttpserver
		npm list -g | find "http-server" > nul
		if !errorlevel! == 0 (
			goto httpserverinstalled
		) else (
			echo:
			echo Local file installation failed. Something's not right.
			echo Unless this was intentional, ask for support or install http-server manually.
			echo Enter "npm install http-server -g" into a command prompt.
			echo:
			pause
			exit
		)
	) else (
		color cf
		echo:
		echo http-server is missing, but somehow Node.js has not been installed yet.
		echo Seems either the install failed, or Vyond: Remastered managed to skip it.
		echo If installing directly from nodejs.org does not work, something is horribly wrong.
		echo Please ask for help in the #support channel on Discord, or email me.
		pause
		exit
	)
	:httpserverinstalled
	echo http-server has been installed.
	echo:
	goto install_cert
)

:: Install HTTPS certificate
:install_cert
if !HTTPSCERT_DETECTED!==n (
	echo Installing HTTPS certificate...
	echo:
	if not exist "server\the.crt" (
		echo ...except it doesn't exist for some reason.
		echo Vyond: Remastered requires this to run.
		echo You should get a "the.crt" file from someone else, or redownload Vyond: Remastered.
		echo Offline has nothing left to do since it can't launch without the.crt, so it will close.
		pause
		exit
	)
	:: Check for admin
	if /i not "!SAFE_MODE!"=="y" (
		fsutil dirty query !systemdrive! >NUL 2>&1
		if /i not !ERRORLEVEL!==0 (
			if %VERBOSEWRAPPER%==n ( cls )
			echo For Vyond: Remastered to work, it needs an HTTPS certificate to be installed.
			echo If you have administrator privileges, you should reopen start_vyond.bat as Admin.
			echo ^(do this by right-clicking start_vyond.bat and click "Run as Administrator"^)
			echo:
			echo If you can't do that, there's another method, but it's less reliable and is done per-browser.
			echo: 
			echo Press Y if you have admin access, and press N if you don't.
			:certaskretry
			set /p CERTCHOICE= Response:
			echo:
			if not '!certchoice!'=='' set certchoice=%certchoice:~0,1%
			if /i "!certchoice!"=="y" echo This window will now close so you can restart it with admin. & pause & exit
			if /i "!certchoice!"=="n" goto certnonadmin
			echo You must answer Yes or No. && goto certaskretry

			:: Non-admin cert install
			pushd utilities
			start SilentCMD open_http-server.bat
			popd
			echo: 
			echo A web browser window will open.
			echo When you see a security notice, go past it.
			echo This is completely harmless in a local setting like this.
			echo If you see a message like this on the real internet, you should stay away.
			:: Pause to allow startup
			PING -n 8 127.0.0.1>nul
			if !INCLUDEDCHROMIUM!==n (
				if !CUSTOMBROWSER!==n (
					start https://localhost:4664/certbypass.html
				) else (
					start !CUSTOMBROWSER! https://localhost:4664/certbypass.html >nul
				)
			) else (
				pushd utilities\ungoogled-chromium
				start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile https://localhost:4664/certbypass.html >nul
				popd
			)
			pause
			echo:
			echo If you intend on using another browser, you'll have to do this again by going to the server page and passing the security message.
			echo You've used a non-admin method of installing the HTTPS certificate. To redo the process, delete this file. > utilities\checks\httpscert.txt
			goto after_cert_install
		)
	)
	pushd server
	if %VERBOSEWRAPPER%==y (
		if !DRYRUN!==n ( certutil -addstore -f -enterprise -user root the.crt )
	) else (
		if !DRYRUN!==n ( certutil -addstore -f -enterprise -user root the.crt >nul )
	)
	set ADMINREQUIRED=y
	popd
)
:after_cert_install

:: Alert user to restart Vyond Remastered without running as Admin
if !ADMINREQUIRED!==y (
	color 20
	if %VERBOSEWRAPPER%==n ( cls )
	echo:
	echo Dependencies needing Admin now installed^^!
	echo:
	echo Vyond: Remastered no longer needs Admin rights,
	echo please restart normally by double-clicking.
	echo:
	echo If you saw this from running normally,
	echo Vyond: Remastered should continue normally after a restart.
	echo:
	if !DRYRUN!==y (
		echo ...you enjoying the dry run experience? Skipping closing.
		pause
		color 0f
		goto skip_dependency_install
	)
	pause
	exit
)
color 0f
echo All dependencies now installed^^! Continuing with Vyond: Remastered boot.
echo:

:skip_dependency_install

::::::::::::::::::::
:: Starting Vyond ::
::::::::::::::::::::

title Vyond: Remastered v!WRAPPER_VER! [Loading...]

:: Close existing node apps
:: Hopefully fixes EADDRINUSE errors??
if %VERBOSEWRAPPER%==y (
        echo Closing any existing node and/or PHP apps and batch processes...
	for %%i in (npm start,npm,http-server,HTTP-SERVER HASN'T STARTED,NODE.JS HASN'T STARTED YET) do (
		if !DRYRUN!==n ( TASKKILL /FI "WINDOWTITLE eq %%i" >nul 2>&1 )
	)
	echo Closing any existing node apps...
	if !DRYRUN!==n ( TASKKILL /IM node.exe /F )
	echo:
) else (
	if !DRYRUN!==n ( TASKKILL /IM node.exe /F 2>nul )
)

:: Start Node.js and http-server 
if !CEPSTRAL!==n (
	echo Loading Node.js and http-server...
) else (
	echo Loading Node.js and http-server...
)
pushd utilities
if %VERBOSEWRAPPER%==y (
	if !DRYRUN!==n ( start /MIN open_http-server.bat )
	if !DRYRUN!==n ( start /MIN open_nodejs.bat )
) else (
	if !DRYRUN!==n ( start SilentCMD open_http-server.bat )
	if !DRYRUN!==n ( start SilentCMD open_nodejs.bat )
	)
)
popd
title Vyond: Remastered v!WRAPPER_VER! [Loading npm...]
echo Everything should loaded by now. Vyond Remastered should open shortly. 
echo If you have verbose mode enabled, 
echo then you can check the npm window to see if Vyond Remastered has started or not.
echo you don't have to wait for 9999 seconds to exit this file. you can just exit this file by pressing a key.
timeout 30>nul
if %VERBOSEWRAPPER%==y ( echo if vyond remastered takes longer to start, please check an npm related window in order to see what is causing the error.
echo if you don't see anything obvious, then it's your computer acting slow. ) else (
echo if vyond remastered takes longer to start, then it's your computer acting slow. )
timeout 9969>nul & exit

:configcopy
if %NODE_ENV%==dev ( set VBOSEPERMS=y ) else ( set VBOSEPERMS=n )
if not exist utilities ( md utilities )
echo :: Vyond: Remastered Config>> utilities\config.bat
echo :: This file is modified by settings.bat. It is not organized, but comments for each setting have been added.>> utilities\config.bat
echo :: You should be using settings.bat, and not touching this. Vyond Remastered relies on this file remaining consistent, and it's easy to mess that up.>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Opens this file in Notepad when run>> utilities\config.bat
echo setlocal>> utilities\config.bat
echo if "%%SUBSCRIPT%%"=="" ( pushd "%~dp0utilities" ^& start notepad.exe config.bat ^& exit )>> utilities\config.bat
echo endlocal>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Shows exactly Remastered is doing, and never clears the screen. Useful for development and troubleshooting. Default: %VBOSEPERMS%>> utilities\config.bat
echo set VERBOSEWRAPPER=%VBOSEPERMS%>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Won't check for dependencies (flash, node, etc) and goes straight to launching. Useful for speedy launching post-install. Default: n>> utilities\config.bat
echo set SKIPCHECKDEPENDS=n>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Won't install dependencies, regardless of check results. Overridden by SKIPCHECKDEPENDS. Mostly useless, why did I add this again? Default: n>> utilities\config.bat
echo set SKIPDEPENDINSTALL=n>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Opens Offline in an included copy of ungoogled-chromium. Allows continued use of Flash as modern browsers disable it. Default: y>> utilities\config.bat
echo set INCLUDEDCHROMIUM=y>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Opens INCLUDEDCHROMIUM in headless mode. Looks pretty nice. Overrides CUSTOMBROWSER and BROWSER_TYPE. Default: y>> utilities\config.bat
echo set APPCHROMIUM=y>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Opens Offline in a browser of the user's choice. Needs to be a path to a browser executable in quotes. Default: n>> utilities\config.bat
echo set CUSTOMBROWSER=n>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Lets the launcher know what browser framework is being used. Mostly used by the Flash installer. Accepts "chrome", "firefox", and "n". Default: n>> utilities\config.bat
echo set BROWSER_TYPE=chrome>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Runs through all of the scripts code, while never launching or installing anything. Useful for development. Default: n>> utilities\config.bat
echo set DRYRUN=n>> utilities\config.bat
echo:>> utilities\config.bat
echo :: Allows you to use GA4SR instead of vyond remastered by default. this is useful for if you want goanimate for schools back. Default: n>> utilities\config.bat
echo set USEGA4SR=n>> utilities\config.bat
echo:>> utilities\config.bat
cls & goto returnfromconfigcopy