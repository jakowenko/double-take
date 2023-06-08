#!/bin/sh

# https://github.com/edsrzf/gofmt-git-hook
IFS='
'
exitcode=0
for file in `git diff --cached --name-only --diff-filter=ACM | grep '\.go$'`
do
    output=`gofmt -w "$file"`
    if test -n "$output"
    then
        # any output is a syntax error
        echo >&2 "$output"
        exitcode=1
    fi
    git add "$file"
done
exit $exitcode
