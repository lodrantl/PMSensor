import queue
from configparser import ConfigParser

from influxdb import SeriesHelper, InfluxDBClient

from client.pmreader import PMReader

config_parser = ConfigParser()
config_parser.read('pmsensor.ini')
config = config_parser['DEFAULT']

print(config['host'])

myclient = InfluxDBClient(config['host'], int(config['port']), config['user'], config['password'], config['dbname'])

myclient.create_database(config['dbname'], if_not_exists=True)
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
        # autocommit must be set to True when using bulk_size
        autocommit = True


def store(data):
    PMSeriesHelper(sensor_id=config['sensor_id'], pm_25=data[0], pm_10=data[1])
    print(PMSeriesHelper._json_body_())

queue = queue.Queue()
sensor = PMReader("COM4", store)
sensor.start()

# while True:
#     if not queue.empty():
#         data = queue.get()
#         print(data)
#         store(data)
#         time.sleep(0.8)

