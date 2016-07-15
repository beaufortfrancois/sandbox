# Build [BlueZ](http://www.bluez.org/) from source on your Chromebook in [Dev Mode](https://www.chromium.org/chromium-os/poking-around-your-chrome-os-device), with [crouton](https://github.com/dnschneid/crouton) and run it.

## Requirements

  1. Download crouton at https://goo.gl/fd3zc in your `Downloads` folder
  2. Open a shell (`Ctrl+Alt+T`, type `shell` and hit enter) and run `sudo sh ~/Downloads/crouton -t cli-extra -r trusty`
  3. Wait patiently and answer the prompts like a good person.

## Compile BlueZ

```bash
sudo enter-chroot

sudo apt-get -y install automake autotools-dev bison check clang flex lcov libcap-ng-dev libdbus-glib-1-dev libdw-dev libglib2.0-dev libical-dev libreadline-dev libtool libudev-dev
cd ~/Downloads/
git clone git://git.kernel.org/pub/scm/bluetooth/bluez.git
cd bluez/
./bootstrap-configure --disable-systemd --disable-android
make

exit
```

## Replace BlueZ

```bash
sudo su

stop bluetoothd

cp /home/chronos/user/Downloads/bluez/src/bluetoothd /usr/local/
cp /home/chronos/user/Downloads/bluez/client/bluetoothctl /usr/local/

mount --bind /usr/local/bluetoothd /usr/libexec/bluetooth/bluetoothd
mount --bind /usr/local/bluetoothctl /usr/bin/bluetoothctl

start bluetoothd

exit
```

## Reset BlueZ

```bash
sudo umount /usr/libexec/bluetooth/bluetoothd 
sudo umount /usr/bin/bluetoothctl
```

## Run BlueZ in Debug Mode

```bash
/sbin/minijail0 -u bluetooth -g bluetooth -G -c 3500 -- /usr/libexec/bluetooth/bluetoothd -d --nodetach
```

With Experimental Interfaces ON,

```bash
/sbin/minijail0 -u bluetooth -g bluetooth -G -c 3500 -- /usr/libexec/bluetooth/bluetoothd -d -E --nodetach
```
