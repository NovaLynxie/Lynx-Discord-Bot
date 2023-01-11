clear
echo "Configuring REPL for NodeJS v16. Please wait..."
#install latest node before starting (replit uses older versions...)
npm install --save-dev node@16
clear
echo "Preparing to install application dependencies..."
npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH && npm clean-install --also=dev