@echo off
:: Open Vyond Remastered in preferred browser
if "%SUBSCRIPT%"=="" ( echo You can't launch this file by just double clicking on it, using the launchBrowser.bat file, 
echo nor using the open_nodejs.bat file located in the utilities folder. && pause & exit )
    if %INCLUDEDCHROMIUM%==n (
        if %CUSTOMBROWSER%==n (
            echo Opening Vyond: Remastered in your default browser...
            if %DRYRUN%==n ( start http://localhost:4343 )
        ) else (
            echo Opening Vyond: Remastered in your set browser...
            echo If this does not work, you may have set the path wrong.
            if %DRYRUN%==n ( start %CUSTOMBROWSER% http://localhost:4343 )
        )
    ) else (
        echo Opening Vyond: Remastered using included Chromium...
        pushd %~dp0utilities\ungoogled-chromium
        if %APPCHROMIUM%==y (
            if %DRYRUN%==n ( start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile --app=http://localhost:4343 )
        ) else (
            if %DRYRUN%==n (  start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile http://localhost:4343 )
        )
        popd
    )

    echo Vyond: Remastered has been started^^! The video list should now be open.

    ::::::::::::::::
    :: Post-Start ::
    ::::::::::::::::
    
    title Vyond: Remastered v%WRAPPER_VER%
    if %VERBOSEWRAPPER%==y ( goto wrapperstarted )
    :wrapperstartedcls
    cls
    :wrapperstarted
    
    echo:
    echo Vyond: Remastered v%WRAPPER_VER% running
    echo A project from Davids Creation adapted by Benson
    echo:
    echo:
    echo Enter 1 to reopen the video list
    echo Enter 2 to open the server page
    if %NODE_ENV%==dev (
        echo Enter 3 to open files for Vyond Remastered.
    )
    echo Enter clr, cls, or clear to clean up the screen
    echo Enter 0 to close Vyond: Remastered
    :wrapperidle
    echo:
    set /p CHOICE=Choice:
    if /i "%choice%"=="0" goto exitwrapperconfirm
    if /i "%choice%"=="1" goto reopen_webpage
    if /i "%choice%"=="2" goto open_server
    if /i "%choice%"=="clr" goto wrapperstartedcls
    if /i "%choice%"=="cls" goto wrapperstartedcls
    if /i "%choice%"=="clear" goto wrapperstartedcls
    if %NODE_ENV%==dev (
        if /i "%choice%"=="3" goto open_files
    )
    echo Time to choose. && goto wrapperidle

    :reopen_webpage
    if %INCLUDEDCHROMIUM%==n (
        if %CUSTOMBROWSER%==n (
            echo Opening Vyond: Remastered in your default browser...
            start http://localhost:4343
        ) else (
            echo Opening Vyond: Remastered in your set browser...
            start %CUSTOMBROWSER% http://localhost:4343 >nul
            )
        ) else (
            echo Opening Vyond: Remastered using included Chromium...
            pushd %~dp0utilities\ungoogled-chromium
            if %APPCHROMIUM%==y (
                start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile --app=http://localhost:4343 >nul
            ) else (
                start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile http://localhost:4343 >nul
            )
        popd
    )
    goto wrapperidle
    
    :open_server
    if %INCLUDEDCHROMIUM%==n (
        if %CUSTOMBROWSER%==n (
            echo Opening the server page in your default browser...
            start https://localhost:4664
        ) else (
            echo Opening the server page in your set browser...
            start %CUSTOMBROWSER% https://localhost:4664 >nul
        )
    ) else (
        echo Opening the server page using included Chromium...
        pushd %~dp0utilities\ungoogled-chromium
        if %APPCHROMIUM%==y (
            start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile --app=https://localhost:4664 >nul
        ) else (
            start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile https://localhost:4664 >nul
        )
        popd
    )
    goto wrapperidle
    
    :open_files
    echo Opening the Vyond Remastered folder...
    start explorer.exe %~dp0
    popd
    goto wrapperidle
    
    ::::::::::::::
    :: Shutdown ::
    ::::::::::::::
    
    :: Confirmation before shutting down
    :exitwrapperconfirm
    echo:
    echo Are you sure you want to quit Vyond: Remastered?
    echo Be sure to save all your work.
    echo Type Y to quit, and N to go back.
    :exitwrapperretry
    set /p EXITCHOICE= Response:
    echo:
    if /i "%exitchoice%"=="y" goto point_extraction
    if /i "%exitchoice%"=="yes" goto point_extraction
    if /i "%exitchoice%"=="n" goto wrapperstartedcls
    if /i "%exitchoice%"=="no" goto wrapperstartedcls
    if /i "%exitchoice%"=="with style" goto exitwithstyle
    echo You must answer Yes or No. && goto exitwrapperretry

    :point_extraction
    set WRAPPER_STARTED=n

    title Vyond: Remastered v%WRAPPER_VER% [Shutting down...]

    :: Shut down Node.js and http-server
    if %VERBOSEWRAPPER%==y (
	    if %DRYRUN%==n ( TASKKILL /IM node.exe /F )
	    echo:
    ) else (
	    if %DRYRUN%==n ( TASKKILL /IM node.exe /F 2>nul )
    )

    :: This is where I get off.
    echo Vyond: Remastered has been shut down.
    echo This window will now close.
    if %INCLUDEDCHROMIUM%==y (
	    echo You can close the web browser now.
    )
    echo Open start_vyond_windows.bat again to start Vyond Remastered again.
    if %DRYRUN%==y ( echo Go wet your run next time. ) 
    pause & exit