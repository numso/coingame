SUPERVISOR := ./node_modules/.bin/supervisor

all:
	@make -j browserify styl server

run: all

install:
	@npm install

server:
	@$(SUPERVISOR) -q -w controllers,middlewares,app.js app

browserify:
	@$(SUPERVISOR) -q -e 'js|jade' -w views/public,client bin/browserify

styl:
	@$(SUPERVISOR) -q -e 'styl' -w 'public/styl' bin/styl

test: ./node_modules/.bin/mocha

.PHONY: server browserify install run styl test all
