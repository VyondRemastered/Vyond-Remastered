@echo off
:: Open Vyond Remastered in preferred browser
if "%SUBSCRIPT%"=="" ( echo You can't launch this file by just double clicking on it, using the launchBrowser.bat file, 
echo nor using the open_nodejs.bat file located in the utilities folder. && pause & exit )
    if %INCLUDEDCHROMIUM%==n (
        if %CUSTOMBROWSER%==n (
            echo Opening GoAnimate For Schools Remastered in your default browser...
            if %DRYRUN%==n ( start http://localhost )
        ) else (
            echo Opening GoAnimate For Schools Remastered in your set browser...
            echo If this does not work, you may have set the path wrong.
            if %DRYRUN%==n ( start %CUSTOMBROWSER% http://localhost )
        )
    ) else (
        echo Opening GoAnimate For Schools Remastered using included Chromium...
        pushd %~dp0utilities\ungoogled-chromium
        if %APPCHROMIUM%==y (
            if %DRYRUN%==n ( start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile --app=http://localhost )
        ) else (
            if %DRYRUN%==n (  start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile http://localhost )
        )
        popd
    )

    echo GoAnimate For Schools Remastered has been started^^! The video list should now be open.

    ::::::::::::::::
    :: Post-Start ::
    ::::::::::::::::
    
    title GoAnimate For Schools Remastered v2.3.0.1
    if %VERBOSEWRAPPER%==y ( goto wrapperstarted )
    :wrapperstartedcls
    cls
    :wrapperstarted
    
    echo:
    echo GoAnimate For Schools Remastered v2.3.0.1 running
    echo A project from BluePeacocks adapted by VisualPlugin
    echo:
    echo:
    echo Enter 1 to reopen the video list
    if %NODE_ENV%==dev (
        echo Enter 3 to open files for GoAnimate For Schools Remastered.
    )
    echo Enter clr, cls, or clear to clean up the screen
    echo Enter 0 to close GoAnimate For Schools Remastered
    :wrapperidle
    echo:
    set /p CHOICE=Choice:
    if /i "%choice%"=="0" goto exitwrapperconfirm
    if /i "%choice%"=="1" goto reopen_webpage
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
            echo Opening GoAnimate For Schools Remastered in your default browser...
            start http://localhost
        ) else (
            echo Opening GoAnimate For Schools Remastered in your set browser...
            start %CUSTOMBROWSER% http://localhost >nul
            )
        ) else (
            echo Opening GoAnimate For Schools Remastered using included Chromium...
            pushd %~dp0utilities\ungoogled-chromium
            if %APPCHROMIUM%==y (
                start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile --app=http://localhost >nul
            ) else (
                start chrome.exe --allow-outdated-plugins --user-data-dir=the_profile http://localhost >nul
            )
        popd
    )
    goto wrapperidle
    
    :open_files
    echo Opening the GoAnimate For Schools Remastered folder...
    start explorer.exe %~dp0
    popd
    goto wrapperidle
    
    ::::::::::::::
    :: Shutdown ::
    ::::::::::::::
    
    :: Confirmation before shutting down
    :exitwrapperconfirm
    echo:
    echo Are you sure you want to quit GoAnimate For Schools Remastered?
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

    title GoAnimate For Schools Remastered v2.3.0.1 [Shutting down...]

    :: Shut down Node.js and http-server
    if %VERBOSEWRAPPER%==y (
	    if %DRYRUN%==n ( TASKKILL /IM node.exe /F )
	    echo:
    ) else (
	    if %DRYRUN%==n ( TASKKILL /IM node.exe /F 2>nul )
    )

    :: This is where I get off.
    echo GoAnimate For Schools Remastered has been shut down.
    echo This window will now close.
    if %INCLUDEDCHROMIUM%==y (
	    echo You can close the web browser now.
    )
    echo Open start_vyond_windows.bat again to start Vyond Remastered again.
    if %DRYRUN%==y ( echo Go wet your run next time. ) 
    pause & exit