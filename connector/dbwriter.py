#!/usr/bin/env python3

import urllib.request
import urllib.error
import os
import argparse
import socket
import sys
import signal

from configparser import ConfigParser
from influxdb import SeriesHelper, InfluxDBClient
from pmreader import PMReader
from time import sleep
from zeroconf import ServiceInfo, Zeroconf

parser = argparse.ArgumentParser()
parser.add_argument("config", help="path to the config file")
args = parser.parse_args()


folder = os.path.dirname(os.path.abspath(os.path.realpath(__file__)))

config_parser = ConfigParser()
config_parser.read(args.config)
config = config_parser['DEFAULT']

def wait_for_influx(url):
    print('Waiting for InfluxDB to start at: {}'.format(url))
    while True:
        try:
            response = urllib.request.urlopen(url, timeout=1)
            print('InfluxDB accessible')
            return
        except urllib.error.URLError:
            pass


wait_for_influx('http://{}:{}/ping'.format(config['host'], config['port']))

print(config['host'])

myclient = InfluxDBClient(config['host'], int(config['port']), config['user'], config['password'], config['dbname'])

myclient.create_database(config['dbname'])
myclient.create_retention_policy('pm_policy', 'INF', 3, default=True)


class PMSeriesHelper(SeriesHelper):
    class Meta:
        client = myclient
        series_name = 'particulates.{sensor_id}'
        fields = ['pm_25', 'pm_10']
        tags = ['sensor_id']
        bulk_size = 1
        autocommit = True


def store(data):
    PMSeriesHelper(sensor_id=config['sensor_id'], pm_25=data[0], pm_10=data[1])
    print(PMSeriesHelper._json_body_())


sensor = PMReader(config['com_port'], store)
sensor.start()

#Register mDNS

desc = {'sensorId': config['sensor_id']}

info = ServiceInfo("_influxdb._tcp.local.",
                       "PMBox ID " + config['sensor_id'] + "._influxdb._tcp.local.",
                       socket.inet_aton(config['host']), int(config['port']), 0, 0,
                       desc, "rpi2.local.")

print("Registering mDNS service.")
zeroconf = Zeroconf()
zeroconf.register_service(info)
        
def on_kill(e, t):
    print("Unregistering...")
    zeroconf.unregister_service(info)
    zeroconf.close()
    sensor.close()

signal.signal(signal.SIGINT, on_kill)
signal.signal(signal.SIGTERM, on_kill)