export WRAPPER_VER=2.5.0
echo Starting Vyond Remastered... A new browser window should be open soon.
FILE=./package-lock.json
if test -f "$FILE"; then
    npm start
    exit
fi
echo Sorry, but the package-lock.json file does not exist. if it's non existant, then vyond remastered can't start.
sleep 9999
