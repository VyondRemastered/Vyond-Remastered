echo Removing node.js...
FILE=./package-lock.json
if test -f "$FILE"; then
    sudo apt-get purge nodejs -y &&\
    sudo rm -r /etc/apt/sources.list.d/nodesource.list
    echo Removing npm dependecies...
    rm -r node_modules
    rm package-lock.json
    echo everything is removed now. thanks for using vyond remastered.
    sleep 9999
fi
echo the package-lock.json file dosen't exist. because of this, you can't remove any dependecies as that file is needed in order to peform the action.
sleep 9999
