// Copyright © 2021 Ettore Di Giacinto <mudler@mocaccino.org>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, see <http://www.gnu.org/licenses/>.

package main

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"github.com/mholt/archiver/v3"
	"github.com/pkg/errors"
	"github.com/urfave/cli"
	"golang.org/x/sys/unix"

	//"strings"
	"syscall"
)

//go:embed assets.tar.xz
var assets embed.FS

const Version = "1.13.11.9rc1"

func common() []cli.Flag {
	homedir, _ := os.UserHomeDir()
	return []cli.Flag{
		&cli.BoolTFlag{
			Name:  "continue-on-error",
			Usage: "Keep going if extracting some files fails (e.g. due to permission error)",
		},
		&cli.StringFlag{
			Name:  "store",
			Value: "",
			Usage: "Default application store. Empty for TMPDIR",
		},
		&cli.StringSliceFlag{
			Name: "attrs",

			Value: &cli.StringSlice{"ipc", "uts", "user", "ns", "pid"},

			Usage: "Default application sys proc attrs.",
		},
		&cli.StringFlag{
			Name:  "entrypoint",
			Value: "/double-take/entrypoint.sh",
			Usage: "Default application entrypoint",
		},
		&cli.StringSliceFlag{
			Name:  "add-mounts",
			Usage: "Additional mountpoints",
		},
		&cli.StringSliceFlag{
			Name:  "mounts",
			Usage: "Default app mountpoints",

			Value: &cli.StringSlice{"/sys", "/tmp", "/run", homedir + "/.double-take:/.storage"},
		},
	}
}

func main() {

	app := &cli.App{
		Name:        "double-take",
		Version:     Version,
		Author:      "skrashevich",
		Usage:       "double-take",
		Description: "double-take",
		Copyright:   `(c) skrashevich`,
		Action:      start,
		Commands: []cli.Command{
			{
				Name:        "exec",
				Description: "execute program",
				Action:      execute,
				Flags:       common(),
			},
			{
				Name:        "uninstall",
				Description: "uninstall program",
				Action:      uninstall,
				Flags:       common(),
			},
		},
		Flags: common(),
	}

	err := app.Run(os.Args)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	return
}

func pivotRoot(newroot string) error {
	// Create new mount namespace so mounts don't leak
	if err := syscall.Unshare(syscall.CLONE_NEWNS); err != nil {
		return fmt.Errorf("Error creating mount namespace before pivot: %v", err)
	}

	putold := filepath.Join(newroot, ".pivot_root")

	// bind mount newroot to itself - this is a slight hack needed to satisfy the
	// pivot_root requirement that newroot and putold must not be on the same
	// filesystem as the current root
	if err := syscall.Mount(newroot, newroot, "", syscall.MS_BIND|syscall.MS_REC, ""); err != nil {
		return err
	}

	// create putold directory
	if err := os.MkdirAll(putold, 0700); err != nil {
		return err
	}

	// call pivot_root
	if err := syscall.PivotRoot(newroot, putold); err != nil {
		return err
	}

	// ensure current working directory is set to new root
	if err := os.Chdir("/"); err != nil {
		return err
	}

	// umount putold, which now lives at /.pivot_root
	putold = "/.pivot_root"
	if err := syscall.Unmount(putold, syscall.MNT_DETACH); err != nil {
		return err
	}

	// remove putold
	if err := os.RemoveAll(putold); err != nil {
		return err
	}

	return nil
}

func mountProc(newroot string) error {
	source := "proc"
	target := filepath.Join(newroot, "/proc")
	fstype := "proc"
	flags := 0
	data := ""

	os.MkdirAll(target, 0755)
	if err := syscall.Mount(
		source,
		target,
		fstype,
		uintptr(flags),
		data,
	); err != nil {
		return err
	}

	return nil
}

func touch(f string) error {
	_, err := os.Stat(f)
	if os.IsNotExist(err) {
		file, err := os.Create(f)
		if err != nil {
			return err
		}
		defer file.Close()
	}
	return nil
}

func mountBind(hostfolder, newroot, dst string, rw bool) error {
	source := hostfolder
	target := filepath.Join(newroot, dst)
	fstype := "bind"
	data := ""

	f, err := os.Stat(hostfolder)
	if err != nil {
		return err
	}

	if !f.IsDir() {
		touch(target)
	} else {
		os.MkdirAll(target, 0755)
	}

	if rw {
		if err := syscall.Mount(source, target, fstype, syscall.MS_BIND|syscall.MS_REC, data); err != nil {
			return err
		}
	} else {
		fmt.Println("Mount", hostfolder, "readonly")
		if err := syscall.Mount(source, target, fstype, syscall.MS_BIND|syscall.MS_REC|syscall.MS_RDONLY, data); err != nil {
			return err
		}

		// Remount to make it read only
		// see https://github.com/containerd/containerd/pull/1373/files
		if err := syscall.Mount("", target, "", syscall.MS_BIND|syscall.MS_REC|syscall.MS_RDONLY|unix.MS_REMOUNT, data); err != nil {
			return err
		}
	}

	return nil
}

func uninstall(c *cli.Context) error {
	store := renderString(c.String("store"))
	if store != "" {
		return os.RemoveAll(store)
	}
	return nil
}

// This starts the real bundle entrypoint
// TODO: need to make this multi-platform
func execute(c *cli.Context) error {
	store := c.String("store")
	store = filepath.Join(store, "bundle")
	fmt.Printf("Starting double-take %s with store at %s\n", Version, store)
	if err := mountProc(store); err != nil {
		fmt.Println("failed mounting /proc")
	}

	for _, hostMount := range append(c.StringSlice("mounts"), c.StringSlice("add-mounts")...) {
		target := hostMount
		rw := true
		if strings.Contains(hostMount, ":") {
			dest := strings.Split(hostMount, ":")
			if len(dest) == 3 {
				if dest[0] == "ro" {
					rw = false
				}
				hostMount = dest[1]
				target = dest[2]
			} else if len(dest) == 2 {
				hostMount = dest[0]
				target = dest[1]
			} else {
				return errors.New("Invalid arguments for mount, it can be: fullpath, or source:target")
			}
		}
		fmt.Printf("Mounting %s to %s %s (rw: %t)\n", hostMount, store, target, rw)
		if _, err := os.Stat(hostMount); err != nil {
			fmt.Printf("%s doesn't exist, creating it\n", hostMount)
			os.MkdirAll(hostMount, 0700)
		}
		if err := mountBind(hostMount, store, target, rw); err != nil {
			fmt.Printf("failed mounting '%s' on rootfs\n", hostMount)
		}
	}

	if err := pivotRoot(store); err != nil {
		fmt.Println("failed pivotroot at", store)
	}

	// Support ./binary - ....
	args := c.Args()
	if len(c.Args()) > 0 && c.Args()[0] == "-" {
		args = c.Args().Tail()
	}

	cmd := exec.Command(c.String("entrypoint"), args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

func renderString(s string) string {
	// support $HOME passed as store
	home, _ := os.UserHomeDir()
	s = strings.ReplaceAll(s, "$HOME", home)
	return s
}

func start(c *cli.Context) error {
	store := renderString(c.String("store"))

	// Setup store, used by the real process later on
	if store == "" {
		tempdir, err := ioutil.TempDir("", "double-take")
		if err != nil {
			return err

		}
		defer os.RemoveAll(tempdir)
		store = tempdir
	} else {
		if !filepath.IsAbs(store) {
			store, _ = filepath.Abs(store)
		}
	}

	os.MkdirAll(store, os.ModePerm)
	var version string
	if _, err := os.Stat(path.Join(store, "VERSION")); err == nil {
		d, err := ioutil.ReadFile(path.Join(store, "VERSION"))
		if err != nil {
			return err
		}
		version = string(d)
	}

	if version != Version {
		fmt.Printf("Extracting double-take %s bundle data (xz) into %s ...\n", Version, store)
		os.RemoveAll(path.Join(store, "bundle"))
		err := copyBinary(store, c.Bool("continue-on-error"))
		if err != nil {
			if !c.Bool("continue-on-error") {
				must(err)
			}
			fmt.Println("Failed copying binaries:", err.Error())
		}
		must(ioutil.WriteFile(path.Join(store, "VERSION"), []byte((Version)), os.ModePerm))
	}

	var mounts []string

	for _, m := range append(c.StringSlice("mounts"), c.StringSlice("add-mounts")...) {
		m := renderString(m)
		mounts = append(mounts, []string{"--mounts", m}...)
	}

	// TODO: Custom default args injected from bundler
	cmd := exec.Command("/proc/self/exe",
		append(
			append(
				[]string{
					"exec",
					"--store",
					store,
					"--entrypoint",
					c.String("entrypoint"),
				},
				mounts...,
			),
			c.Args()...,
		)...,
	)

	var cloneFlags uintptr
	for _, a := range c.StringSlice("attrs") {
		switch strings.ToLower(a) {
		case "ns":
			cloneFlags |= syscall.CLONE_NEWNS
		case "uts":
			cloneFlags |= syscall.CLONE_NEWUTS
		case "ipc":
			cloneFlags |= syscall.CLONE_NEWIPC
		case "pid":
			cloneFlags |= syscall.CLONE_NEWPID
		case "net":
			cloneFlags |= syscall.CLONE_NEWNET
		case "user":
			cloneFlags |= syscall.CLONE_NEWUSER
		}
	}

	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: cloneFlags,
		UidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 0,
				HostID:      os.Getuid(),
				Size:        1,
			},
		},
		GidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 0,
				HostID:      os.Getgid(),
				Size:        1,
			},
		},
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()

	return cmd.Run()
}

func copyBinary(state string, continueOnError bool) error {
	source := "assets.tar.xz"

	f, err := assets.Open(source)
	if err != nil {
		return err
	}

	if err := copyFileContents(f, filepath.Join(state, source)); err != nil {
		return err
	}

	uaIface, err := archiver.ByExtension(source)
	if err != nil {
		return err
	}

	un, ok := uaIface.(archiver.Unarchiver)
	if !ok {
		return fmt.Errorf("format specified by source filename is not an archive format: %s (%T)", source, uaIface)
	}

	mytar := &archiver.Tar{
		OverwriteExisting:      true,
		MkdirAll:               true,
		ImplicitTopLevelFolder: false,
		ContinueOnError:        continueOnError,
	}

	switch v := uaIface.(type) {
	case *archiver.Tar:
		uaIface = mytar
	case *archiver.TarBrotli:
		v.Tar = mytar
	case *archiver.TarBz2:
		v.Tar = mytar
	case *archiver.TarGz:
		v.Tar = mytar
	case *archiver.TarLz4:
		v.Tar = mytar
	case *archiver.TarSz:
		v.Tar = mytar
	case *archiver.TarXz:
		v.Tar = mytar
	case *archiver.TarZstd:
		v.Tar = mytar
	}
	return un.Unarchive(filepath.Join(state, "assets.tar.xz"), filepath.Join(state, "bundle"))
}

func copyFileContents(in fs.File, dst string) (err error) {
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return
	}
	defer func() {
		cerr := out.Close()
		if err == nil {
			err = cerr
		}
	}()
	if _, err = io.Copy(out, in); err != nil {
		return
	}
	err = out.Sync()

	os.Chmod(dst, 0755)
	return
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
