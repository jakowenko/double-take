all: test
precommit: gofmt-staged

gofmt-staged:
	./gofmt-staged.sh

testdata:
	git clone https://github.com/Kagami/go-face-testdata testdata

test: testdata
	go test -v
