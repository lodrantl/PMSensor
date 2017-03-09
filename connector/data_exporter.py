#!/usr/bin/env python3

import urllib.request
import urllib.error
import argparse
import signal

from configparser import ConfigParser
from influxdb import InfluxDBClient
from time import sleep

import functools
print = functools.partial(print, flush=True)

parser = argparse.ArgumentParser()
parser.add_argument('config', help='path to the config file')
parser.add_argument("--daemon", help="enable daemon mode", action="store_true")

args = parser.parse_args()
config_parser = ConfigParser()
config_parser.read(args.config)
config = config_parser['DEFAULT']


def check_influx(url, blocking=True):
    print('Waiting for InfluxDB to start at: {}'.format(url))
    while True:
        try:
            urllib.request.urlopen(url, timeout=5)
            print('InfluxDB accessible')
            return True
        except urllib.error.URLError:
            if not blocking:
                return False


check_influx(
    'http://{}:{}/ping'.format(config['influx_host'], config['influx_port']))


source = InfluxDBClient(
    config['influx_host'],
    int(config['influx_port']),
    config['influx_user'],
    config['influx_password'],
    'pm',
    timeout=30
)

target = InfluxDBClient(
    config['influx_remote_host'],
    int(config['influx_remote_port']),
    config['influx_remote_user'],
    config['influx_remote_password'],
    'pm',
    config['influx_remote_https'] == 'true',
    timeout=30
)

target.create_database('pm')
target.create_retention_policy('pm_policy', 'INF', 3, default=True)
target.create_retention_policy('event_policy', 'INF', 3, default=False)


def migrate_pm():
    export_query = source.query(
        'SELECT last(completed) FROM "exports" WHERE sensor_id = \'{}\''
        .format(config['sensor_id'])
    )
    exports = list(export_query.get_points())
    last = 0
    if len(exports) > 0:
        last = "'{}'".format(exports[0]['time'])

    new_last = None

    result = None
    result_len = 4500
    i = 0

    while result_len == 4500:
        result = source.query(
            'SELECT * FROM "particulates" WHERE time > {} AND sensor_id = \'{}\' LIMIT 4500 OFFSET {}'
            .format(last, config['sensor_id'], i * 4500)
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
        if result_len > 0:
            new_last = points[-1]
        target.write_points(points, retention_policy='pm_policy')

    if new_last is not None:
        new_export = {
            'measurement': 'exports',
            'tags': {
                'sensor_id': new_last['tags']['sensor_id']
            },
            'time': new_last['time'],
            'fields': {
                'completed': True
            }
        }
        source.write_points([new_export])

    return (i-1) * 4500 + result_len


def migrate_events():
    result = source.query(
        'SELECT * FROM "events" WHERE sensor_id = \'{}\''
        .format(config['sensor_id'])
    )

    result_len, points = 0, []
    for p in result.get_points():
        result_len = result_len + 1
        points.append({
            'measurement': 'events',
            'tags': {
                'sensor_id': p['sensor_id']
            },
            'time': p['time'],
            'fields': {
                'comment': p['comment'],
                'ends': int(p['ends']),
                'starts': int(p['starts']),
                'pm_10': float(p['pm_10']),
                'pm_25': float(p['pm_25'])
            }
        })

    target.write_points(points, retention_policy='event_policy')

    return result_len


class GracefulKiller:
    kill_now = False

    def __init__(self):
        signal.signal(signal.SIGINT, self.exit_gracefully)
        signal.signal(signal.SIGTERM, self.exit_gracefully)

    def exit_gracefully(self, signum, frame):
        self.kill_now = True

if args.daemon:
    killer = GracefulKiller()
    migrate_in = 30
    while True:
        migrate_in -= 1
        if migrate_in <= 0:
            if config['influx_remote_https'] == "true":
                available = check_influx(
                    'https://{}:{}/ping'.format(config['influx_remote_host'], config['influx_remote_port']))
            else:
                available = check_influx(
                    'http://{}:{}/ping'.format(config['influx_remote_host'], config['influx_remote_port']))
            if available:
                print('Started migration.')
                try:
                    n = migrate_pm()
                    m = migrate_events()
                    print('Migrated {} points and {} events.'.format(n, m))
                except Exception as e:
                    print('Migration failed with error {}.'.format(e))
                migrate_in = 60 * 90
            else:
                print('Remote InfluxDB unavailable.')
                migrate_in = 30

        if killer.kill_now:
            print('Stopping pmsensor data exporter...')
            break
        sleep(1)
else:
    print('Started migration.')
    n = migrate_events()
    m = migrate_pm()
    print('Migrated {} points and {} events.'.format(m, n))
