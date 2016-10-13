# PMSensor

A python application for working with SDS011 PM sensor on Rasberry PI.

## Server configuration

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
2. Set the **PM_HOME** variable to the the `/your/install/path/connector`
3. Run `sudo systemctl daemon-reload`
3. Run `sudo systemctl enable pmsensor`
4. Run `sudo systemctl start pmsensor`

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

