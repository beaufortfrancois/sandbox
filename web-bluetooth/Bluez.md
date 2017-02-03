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
./bootstrap && ./configure --localstatedir=/var --enable-datafiles --enable-library --disable-systemd --disable-obex --enable-sixaxis --disable-network
make

exit
```

See https://chromium.googlesource.com/chromiumos/overlays/chromiumos-overlay/+/master/net-wireless/bluez/bluez-9999.ebuild

## Replace BlueZ

```bash
sudo su

stop bluetoothd

cp /home/chronos/user/Downloads/bluez/src/bluetoothd /usr/local/
cp /home/chronos/user/Downloads/bluez/client/bluetoothctl /usr/local/

umount /usr/libexec/bluetooth/bluetoothd
umount /usr/bin/bluetoothctl

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

## Tips

Patch below allows all services to be accessible in `bt_console`:

```diff
diff --git a/src/device.c b/src/device.c
index 8693eb8..20a59fa 100644
--- a/src/device.c
+++ b/src/device.c
@@ -3380,12 +3380,6 @@ done:
        service = l->data;
        profile = btd_service_get_profile(service);
 
-       /* Claim attributes of internal profiles */
-       if (!profile->external) {
-               /* Mark the service as claimed by the existing profile. */
-               gatt_db_service_set_claimed(attr, true);
-       }
-
        /* Notify driver about the new connection */
        service_accept(service);
 }
