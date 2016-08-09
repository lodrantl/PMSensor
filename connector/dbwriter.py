from configparser import ConfigParser

from influxdb import SeriesHelper, InfluxDBClient

from pmreader import PMReader

import urllib.request
import urllib.error

config_parser = ConfigParser()
config_parser.read('pmsensor.ini')
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
    # Meta class stores time series helper configuration.
    class Meta:
        # The client should be an instance of InfluxDBClient.
        client = myclient
        # The series name must be a string. Add dependent fields/tags in curly brackets.
        series_name = 'particulates.{sensor_id}'
        # Defines all the fields in this time series.
        fields = ['pm_25', 'pm_10']
        # Defines all the tags for the series.
        tags = ['sensor_id']
        bulk_size = 1
        # autocommit must be set to True when using bulk_size
        autocommit = True


def store(data):
    PMSeriesHelper(sensor_id=config['sensor_id'], pm_25=data[0], pm_10=data[1])
    print(PMSeriesHelper._json_body_())


sensor = PMReader(config['com_port'], store)
sensor.start()
