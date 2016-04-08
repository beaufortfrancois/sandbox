Here's how to build BlueZ from source on your Chromebook in Dev Mode, with crouton and replace system BlueZ.

## Compile BlueZ

```bash
sudo apt-get -y install autotools-dev bison check flex libcap-ng-dev libdbus-glib-1-dev libglib2.0-dev libical-dev libreadline-dev libudev-dev libdw-dev clang lcov
cd ~/Downloads/
git clone git://git.kernel.org/pub/scm/bluetooth/bluez.git
cd bluez/
./bootstrap-configure --disable-systemd --disable-android
make
```

## Override BlueZ

```bash
sudo su
stop bluetoothd

cp /home/chronos/user/Downloads/bluez/src/bluetoothd /usr/local/
cp /home/chronos/user/Downloads/bluez/client/bluetoothctl /usr/local/

mount --bind /usr/local/bluetoothd /usr/libexec/bluetooth/bluetoothd
mount --bind /usr/local/bluetoothctl /usr/bin/bluetoothctl

start bluetoothd
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
