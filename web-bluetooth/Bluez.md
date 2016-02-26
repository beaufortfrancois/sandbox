Here's how to build BlueZ from source on your Chromebook in Dev Mode, with crouton and replace system BlueZ.

## Compile BlueZ

```bash
cd ~/Downloads/
git clone git://git.kernel.org/pub/scm/bluetooth/bluez.git
cd bluez/
./bootstrap-configure
make
```

For some reasons, I had to tweak the `bootstrap-configure` file as this below before running it.

```diff
(trusty)fr@localhost:~/Downloads/bluez(master)$ git diff
diff --git a/bootstrap-configure b/bootstrap-configure
index 87766b1..aa901ad 100755
--- a/bootstrap-configure
+++ b/bootstrap-configure
@@ -12,8 +12,7 @@ fi
                --sysconfdir=/etc \
                --localstatedir=/var \
                --enable-manpages \
-               --enable-backtrace \
                --enable-experimental \
-               --enable-android \
+               --disable-systemd  \
                --enable-sixaxis \
                --disable-datafiles $*
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
