#!/usr/bin/env python3

import urllib.request
import urllib.error
import argparse
import signal

from configparser import ConfigParser
from influxdb import InfluxDBClient
from time import sleep


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


source = InfluxDBClient(
    config['influx_host'],
    int(config['influx_port']),
    config['influx_user'],
    config['influx_password'],
    'pm'
)

target = InfluxDBClient(
    config['influx_remote_host'],
    int(config['influx_remote_port']),
    config['influx_remote_user'],
    config['influx_remote_password'],
    'pm',
    config['influx_remote_https'] == 'true'
)

target.create_database('pm')
target.create_retention_policy('pm_policy', 'INF', 3, default=True)


def migrate():
    result = None
    result_len = 4500
    i = 0

    while result_len == 4500:
        result = source.query(
            'SELECT * FROM "particulates" WHERE sensor_id = \'{}\' LIMIT 4500 OFFSET {}'
                .format(config['sensor_id'], i * 4500)
        )

        i, result_len, points = i + 1, 0, []

        for p in result.get_points():
            result_len = result_len + 1
            points.append({
                'measurement': 'particulates',
                'tags': {
                    'sensor_id': p['sensor_id']
                },
                'time': p['time'],
                'fields': {
                    'pm_10': float(p['pm_10']),
                    'pm_25': float(p['pm_25'])
                }
            })
        target.write_points(points, retention_policy='pm_policy')

    return i * 4500 + result_len


class GracefulKiller:
    kill_now = False

    def __init__(self):
        signal.signal(signal.SIGINT, self.exit_gracefully)
        signal.signal(signal.SIGTERM, self.exit_gracefully)

    def exit_gracefully(self, signum, frame):
        self.kill_now = True


killer = GracefulKiller()

s = 3601

while True:
    if s > 3600:
        print('Started migration.')
        n = migrate()
        print('Migrated {} points.'.format(n))
        s = 0
    if killer.kill_now:
        print('Stopping pmsensor data exporter...')
        break
    sleep(1)
    s = s + 1
