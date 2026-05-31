echo Removing node.js...
FILE=./package-lock.json
if test -f "$FILE"; then
    sudo yum remove nodejs &&\
    rm -r /etc/yum.repos.d/nodesource*.repo &&\
    sudo yum clean all
    echo Removing npm dependecies...
    rm -r node_modules
    rm package-lock.json
    echo Everything is removed now. You may now close this window.
    sleep 9999
fi
echo the package-lock.json file dosen't exist. because of this, you can't remove any dependecies as that file is needed in order to peform the action.
sleep 9999
