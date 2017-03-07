# PMSensor

A python application for working with SDS011 PM sensor on Rasberry PI.

## Ubuntu Core Snap

1. Install Ubuntu Core 16 on Raspberry PI [(Guide)](https://developer.ubuntu.com/core/get-started/raspberry-pi-2-3)
2. Connect to RPi with ssh
3. generate ssh keys
    ```
    sudo su
    ssh-keygen -t rsa -b 4096 -C "{{boxid}}@artes.si"
    ```  
4. append /root/.ssh/id_rsa.pub to /var/lib/influx/.ssh/authorized_keys on haag.artes.si
5. test connection `ssh influxdb@haag.artes.si`
6. create file /root/snap/pmsensor.init with following contents (create it in text-editor then `echo "content" > /root/snap/pmsensor/common/pmsensor.ini` or learn to use vi)
    ```
	[DEFAULT]

	host = {{box wifi ip}}
	user = admin
	password = admin
	port = 8086
	dbname = pm

	sensor_id = {{boxid}}

	com_port = /dev/ttyUSB0
    ```
7. Install pmsensor snap
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


## Server configuration (deprecated)

### DBWriter
1. Install InfluxDB on your Raspberry PI [(Guide)](https://docs.influxdata.com/influxdb/v1.0/introduction/installation/)
2. Install Python3, git and pip3
3. Run this command to install the required Python modules

    ```
    sudo pip3 install pyserial influxdb
    ```
4. clone this repository

    ```
    git clone https://github.com/lodrantl/PMSensor.git
    ```
5. modify connector/pmsensor.ini to match the settings of your InfluxDB database and serial port
6. run dbwriter.py

### Service
1. Copy pmsensor.service into `/lib/systemd/system`
2. Install to /usr/local/bin
```
sudo ln -s /home/pi/Workspace/PMSensor/connector/dbwriter.py /usr/local/bin/dbwriter
sudo chown +x /usr/local/bin/dbwriter
```
3. Enable and start
```
sudo systemctl daemon-reload
sudo systemctl enable pmsensor
sudo systemctl start pmsensor
```

### Avahi zeroconf
1. Install avahi-daemon `sudo apt install avahi-daemon`
2. Copy influxdb.service to `/etc/avahi/services`
3. Run `sudo systemctl restart avahi-daemon.service`

## Client configuration

1. Install PM Sensor Android from [Google Play Store](https://play.google.com/apps/testing/si.lodrant.pm_sensor)
2. In the config tab, set the host and sensor id to match server configuration (default InfluxDB port is 8086)

## Data migration

1. On the main server clone this repository
2. Set the HOST variable to the ip of the Pi with the data
3. Execute import_data.sh as root
