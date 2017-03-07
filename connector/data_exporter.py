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
from time import sleep

parser = argparse.ArgumentParser()
parser.add_argument("config", help="path to the config file")
args = parser.parse_args()
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

source = InfluxDBClient(config['host'], int(
    config['port']), config['user'], config['password'], config['dbname'])
source.create_database(config['dbname'])

target = InfluxDBClient("haag.artes.si", 8086, "admin",
                        "admin", config['dbname'])
target.create_database(config['dbname'])


def on_kill(e, t):
    print("Stopping...")
    running = false

# signal.signal(signal.SIGINT, on_kill)
# signal.signal(signal.SIGTERM, on_kill)


running = True

def migrate():
    results = None
    l = 4500
    i = 0

    while l == 4500:
        result = source.query(
            "SELECT * FROM \"particulates.{}\" LIMIT 4500 OFFSET {}".format(config['sensor_id'], i * 4500))
        i, l, r = i + 1, 0, []

        for p in result.get_points():
            l = l + 1
            r.append({
                "measurement": "particulates." + p['sensor_id'],
                "tags": {
                    "sensor_id": p['sensor_id']
                },
                "time": p['time'],
                "fields": {
                    "pm_10": float(p['pm_10']),
                    "pm_25": float(p['pm_25'])
                }
            })
        target.write_points(r)
    return i * 4500 + l


class GracefulKiller:
  kill_now = False
  def __init__(self):
    signal.signal(signal.SIGINT, self.exit_gracefully)
    signal.signal(signal.SIGTERM, self.exit_gracefully)

  def exit_gracefully(self,signum, frame):
    self.kill_now = True

killer = GracefulKiller()
s = 3601
while True:
    if s > 3600:
        print("Started migration.")
        n = migrate()
        print("Migrated {} points.".format(n))
        s = 0
    if killer.kill_now:
        print("Stopping pmsensor data exporter...")
        break
    sleep(1)
    s = s + 1
