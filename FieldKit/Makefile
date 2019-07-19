app/secrets.js: app/secrets.js.template
	cp app/secrets.js.template app/secrets.js

prettier:
	prettier --write './app/**/*.{ts,js,css,json}'

node_modules:
	npm install
	git config core.hooksPath .githooks
	rm -rf node_modules/*/.git
