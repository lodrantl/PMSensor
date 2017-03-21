#!/usr/bin/env python3

import argparse
import time
import random

from configparser import ConfigParser
from influxdb import SeriesHelper, InfluxDBClient


parser = argparse.ArgumentParser()
parser.add_argument('config', help='path to the config file')
args = parser.parse_args()

config_parser = ConfigParser()
config_parser.read(args.config)
config = config_parser['DEFAULT']


myclient = InfluxDBClient(
    config['influx_remote_host'],
    int(config['influx_remote_port']),
    config['influx_remote_user'],
    config['influx_remote_password'],
    'pm',
    config['influx_remote_https'] == 'true',
    True,
    timeout=30
)

myclient.create_database('pm')
myclient.create_retention_policy('pm_policy', 'INF', 3, default=True)
myclient.create_retention_policy('event_policy', 'INF', 3, default=False)

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

while True:
    x = random.randint(250, 500) / 10
    y = random.randint(150, 400) / 10
    #print(x, y)
    store([x, y])
    time.sleep(1)
