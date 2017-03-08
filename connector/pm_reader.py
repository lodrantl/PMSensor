import serial
import threading
import struct


class PMReader(threading.Thread):
    def __init__(self, port, function):
        self.serial = serial.Serial(port)
        self.function = function
        self.polling = False
        threading.Thread.__init__(self)

    def close(self):
        self.polling = False

    def run(self):
        self.polling = True
        while True:
            old_byte = new_byte = b'\x00'

            while not (old_byte == b'\xaa' and new_byte == b'\xc0'):
                old_byte = new_byte
                new_byte = self.serial.read(1)

            package = self.serial.read(8)

            self.function(self.readValues(package))

            if not self.polling:
                self.serial.close()
                break

    def readValues(self, package):
        unpacked = struct.unpack('<HHxxBB', package)
        # print('Package: {}. Unpacked: {}'.format(package, unpacked))

        checksum = sum(package[:6]) & 255

        if checksum != package[6]:
            print('Checksums do not match. Calculated: {},  Recieved: {}'
                  .format(checksum, package[6]))
            return None, None
        if package[7] != 171:
            print('Recieved package did not end correctly.')
            return None, None

        pm_25 = unpacked[0] / 10
        pm_10 = unpacked[1] / 10
        return pm_25, pm_10


if __name__ == '__main__':
    def printValues(data):
        pm_25, pm_10 = data
        print('PM2.5 value: {} μg/m^3, PM10 {} μg/m^3'.format(pm_25, pm_10))

    sensor = PMReader('COM3', printValues)
    sensor.start()
