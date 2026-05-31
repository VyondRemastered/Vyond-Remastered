echo Installing node.js...
FILE=./package-lock.json
if test -f "$FILE"; then
    echo The package-lock.json file already exists. there is no point of reinstalling any dependecies.
    sleep 9999
fi
curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
echo Installing npm dependecies...
npm install
echo everything is installed now.
echo to start vyond remastered, please double click the start_vyond_linux.sh file.
echo this can be done alot if you plan to use vyond remastered all the time.
sleep 9999
