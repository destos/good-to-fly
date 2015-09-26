INJS = $(wildcard lib/*.js)
OUTJS = $(subst lib/,node/,$(INJS))

BABEL = ./node_modules/.bin/babel

.PHONY: clean

all: $(OUTJS)

clean:
	rm -rf node/

node/%.js: lib/%.js
	$(BABEL) $^ > $@
