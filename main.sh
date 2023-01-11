clear
echo "This project uses NodeJS v16 so repl startup may take a while."
#configure latest node install since replit uses older versions by default.
npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH
node -v
echo "Version configuration complete! Starting bot application..."
clear
npm start #run dev