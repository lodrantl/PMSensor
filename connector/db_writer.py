#!/usr/bin/env python3

import urllib.request
import urllib.error
import argparse
import socket
import signal
import time
import serial

from configparser import ConfigParser
from influxdb import SeriesHelper, InfluxDBClient
from pm_reader import PMReader
from zeroconf import ServiceInfo, Zeroconf

import functools
print = functools.partial(print, flush=True)

parser = argparse.ArgumentParser()
parser.add_argument('config', help='path to the config file')
args = parser.parse_args()

config_parser = ConfigParser()
config_parser.read(args.config)
config = config_parser['DEFAULT']


def wait_for_influx(url):
    print('Waiting for InfluxDB to start at: {}'.format(url))
    while True:
        try:
            urllib.request.urlopen(url, timeout=1)
            print('InfluxDB accessible')
            return
        except urllib.error.URLError:
            pass


wait_for_influx(
    'http://{}:{}/ping'.format(config['influx_host'], config['influx_port']))


myclient = InfluxDBClient(
    config['influx_host'],
    int(config['influx_port']),
    config['influx_user'],
    config['influx_password'],
    'pm'
)

myclient.create_database('pm')
myclient.create_retention_policy('pm_policy', 'INF', 3, default=True)


class PMSeriesHelper(SeriesHelper):
    class Meta:
        client = myclient
        series_name = 'particulates'
        fields = ['pm_25', 'pm_10']
        tags = ['sensor_id']
        bulk_size = 1
        autocommit = True


def store(data):
    PMSeriesHelper(sensor_id=config['sensor_id'], pm_25=data[0], pm_10=data[1])

# Start reading

print("Starting PM sensor reader...")
sensor = PMReader(config['com_port'], store)
sensor.start()

# Register mDNS

desc = {'sensorId': config['sensor_id']}

info = ServiceInfo(
    '_influxdb._tcp.local.',
    'Pimenk ID {}._influxdb._tcp.local.'.format(config['sensor_id']),
    socket.inet_aton(config['propagated_host']),
    int(config['propagated_port']),
    0,
    0,
    desc,
    'pimenk-box.local.'
)

print('Registering mDNS service.')
zeroconf = Zeroconf()
zeroconf.register_service(info)


def on_kill(e, t):
    print('Unregistering...')
    zeroconf.unregister_service(info)
    zeroconf.close()
    sensor.close()


signal.signal(signal.SIGINT, on_kill)
signal.signal(signal.SIGTERM, on_kill)

