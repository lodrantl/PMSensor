# Pimenk

A suite of applications designed for work with SDS011 PM sensor on Rasberry PI.

It consists of a client part written in Ionic framework for Android and published in Google Play store and a server part written mostly in python and packaged as a Ubuntu Core Snap.

Server reads data from the sensor and writes it into an InfluxDB also installed with the Snap, while the mobile app visualizes this data, and allows you to record events.

## Ubuntu Core Snap

1. Install Ubuntu Core 16 on Raspberry PI [(Guide)](https://developer.ubuntu.com/core/get-started/raspberry-pi-2-3)
2. Connect to RPi with ssh
3. create file /root/snap/pmsensor.init with following contents (create it in text-editor then `echo "content" > /root/snap/pimenk/common/pimenk.ini` or learn to use vi)
    ```
    [DEFAULT]

    ; Hostname or IP propagated via mDNS to mobile apps
    propagated_host = 192.168.13.103

    ; Local InfluxDB configuration
    influx_host = localhost
    influx_port = 8086
    influx_user = admin
    influx_password = admin


    ; Remote InfluxDB configuration for continous sync (every 90 min)
    influx_remote_host = haag.artes.si
    influx_remote_port = 8086
    influx_remote_https = false
    influx_remote_user = admin
    influx_remote_password = admin

    ; ID given to the current sensor (unique string)
    sensor_id = lj

    ; Serial port configuration
    com_port = /dev/ttyUSB0
    ```
4. Install pmsensor snap
    ```
    snap install pmsensor --devmode --beta
    ```

All done

## Wifi AP snap

We will configure the wifi access point with wifi-ap snap
```
snap install wifi-ap
wifi-ap.config set wifi.security=wpa2 wifi.security-passphrase=enostavno
wifi-ap.config set wifi.ssid=rpibox-lj

wifi-ap.status
wifi-ap.config set disabled=0 (if disabled)

wifi-ap.config get (shows all other config options)
```


## [Server configuration without Snap (deprecated)](SERVER.md)