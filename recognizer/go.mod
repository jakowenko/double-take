module github.com/skrashevich/double-take/recognizer

go 1.20

require (
	github.com/leandroveronezi/go-recognizer v1.0.1
	github.com/sevlyar/go-daemon v0.1.6
	modernc.org/sqlite v1.23.0
)

require (
	github.com/Kagami/go-face v0.0.0-20210630145111-0c14797b4d0e // indirect
	github.com/disintegration/imaging v1.6.2 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/fogleman/gg v1.3.0 // indirect
	github.com/golang/freetype v0.0.0-20170609003504-e2365dfdc4a0 // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/kardianos/osext v0.0.0-20190222173326-2bc1f35cddc0 // indirect
	github.com/kballard/go-shellquote v0.0.0-20180428030007-95032a82bc51 // indirect
	github.com/mattn/go-isatty v0.0.16 // indirect
	github.com/mattn/go-sqlite3 v1.14.17 // indirect
	github.com/remyoudompheng/bigfft v0.0.0-20230129092748-24d4a6f8daec // indirect
	golang.org/x/image v0.7.0 // indirect
	golang.org/x/mod v0.8.0 // indirect
	golang.org/x/sys v0.8.0 // indirect
	golang.org/x/tools v0.6.0 // indirect
	lukechampine.com/uint128 v1.2.0 // indirect
	modernc.org/cc/v3 v3.40.0 // indirect
	modernc.org/ccgo/v3 v3.16.13 // indirect
	modernc.org/libc v1.22.5 // indirect
	modernc.org/mathutil v1.5.0 // indirect
	modernc.org/memory v1.5.0 // indirect
	modernc.org/opt v0.1.3 // indirect
	modernc.org/strutil v1.1.3 // indirect
	modernc.org/token v1.0.1 // indirect
)

replace github.com/Kagami/go-face => ./pkg/go-face

replace github.com/leandroveronezi/go-recognizer => ./pkg/go-recognizer
