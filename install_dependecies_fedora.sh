echo Installing node.js...
FILE=./package-lock.json
if test -f "$FILE"; then
    echo The package-lock.json file already exists. there is no point of reinstalling any dependecies.
    sleep 9999
fi
curl -fsSL https://rpm.nodesource.com/setup_current.x | sudo bash -
sudo yum install -y nodejs
echo Installing npm dependecies...
npm install
echo Everything is installed now. in order to start vyond remastered, 
echo please double click on the start_vyond_linux.sh file.
sleep 9999
