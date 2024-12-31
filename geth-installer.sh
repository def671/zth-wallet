#!/bin/bash
echo "removing stale directorys"
rm -rf shed  
echo "making a working directory"
mkdir shed
echo "moving into working directory"
cd shed
echo "download and install dependencys"
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install build-essential make git screen unzip curl wget -y
echo "download and install go1.21.12"

wget https://storage.googleapis.com/golang/go1.21.12.linux-amd64.tar.gz
tar -xvf go1.21.12.linux-amd64.tar.gz
rm go1.21.12.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo mv go /usr/local
echo export GOROOT=/usr/local/go >> ~/.profile
echo "export PATH=\$GOPATH/bin:\$GOROOT/bin:\$PATH" >> ~/.profile
source ~/.profile
go version
echo "go should now be installed"
echo "now we clone and build geth"
pwd
git clone https://github.com/ZetherOrg/go-zether.git
cd go-zether
make geth
rm -rf ../../bin/linux/geth
sudo mv build/bin/geth ../../bin/linux/
chmod +x ../../bin/linux/geth
cd ../../shed
git clone https://github.com/ZetherOrg/genesis.git
cd genesis
mkdir ~/.wally
mv zether.json ~/.wally
cd ../../bin/linux
pwd
./geth --datadir ~/.wally --networkid 715131 init ~/.wally/zether.json
echo "Geth is now intialized"
echo "Retrieving the windows executable"
cd ../win
rm geth.exe
wget https://github.com/ZetherOrg/go-zether/releases/download/z1.0.0/windows.zip
unzip windows.zip
echo "Geth for Windows is now in inplace"
