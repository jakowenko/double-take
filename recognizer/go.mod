module github.com/skrashevich/double-take/recognizer

go 1.20

require (
	github.com/leandroveronezi/go-recognizer v1.0.1
	github.com/mattn/go-sqlite3 v1.14.16
	github.com/sevlyar/go-daemon v0.1.6
)

require (
	github.com/Kagami/go-face v0.0.0-20210630145111-0c14797b4d0e // indirect
	github.com/disintegration/imaging v1.6.2 // indirect
	github.com/fogleman/gg v1.3.0 // indirect
	github.com/golang/freetype v0.0.0-20170609003504-e2365dfdc4a0 // indirect
	github.com/kardianos/osext v0.0.0-20190222173326-2bc1f35cddc0 // indirect
	golang.org/x/image v0.5.0 // indirect
	golang.org/x/sys v0.0.0-20220722155257-8c9f86f7a55f // indirect
)

replace github.com/Kagami/go-face => github.com/Visine/go-face v0.0.0-20220717101253-7a4546b8e528

replace github.com/leandroveronezi/go-recognizer => ./pkg/go-recognizer
