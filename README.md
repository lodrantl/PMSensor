# PMSensor

A python application for working with SDS011 PM sensor on Rasberry PI.

## Server configuration

1. Install InfluxDB on your Raspberry PI
2. Install python, git and pip
3. Run this command to install the required Python modules
```
pip install pyserial influxdb
```
4. clone this repository
```
git clone https://github.com/lodrantl/PMSensor.git
```
5. modify connector/pmsensor.ini to match the settings of your InfluxDB database and serial port
6. run dbwriter.py

## Client configuration

1. Install PM Sensor Android from Google Play Store [Link unavailable]
2. In the config tab, set the host and sensor id to match server configuration (default InfluxDB port is 8086)