# Compile BlueZ

```bash
cd ~/Downloads/
git clone git://git.kernel.org/pub/scm/bluetooth/bluez.git
cd bluez
./bootstrap-configure
make
```

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
                
# Override BlueZ

```bash
sudo su
stop bluetoothd

cp /home/chronos/user/Downloads/bluez/src/bluetoothd /usr/local/
mount --bind /usr/local/bluetoothd /usr/libexec/bluetooth/bluetoothd   


cp /home/chronos/user/Downloads/bluez/client/bluetoothctl /usr/local/
mount --bind /usr/local/bluetoothctl /usr/bin/bluetoothctl

start bluetoothd
```

# Reset BlueZ

```bash
sudo umount  /usr/libexec/bluetooth/bluetoothd 
sudo umount  /usr/bin/bluetoothctl
```

