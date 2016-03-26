import serial
import time
import threading
import struct

class PMSensor:
    def __init__(self, port):
        self.serial = serial.Serial(port);

    def close(self):
        self.serial.close()

    def _readPackage(self):
        self.serial.flush()

        old_byte = new_byte = b'\x00'

        while not (old_byte == b'\xaa' and new_byte == b'\xc0'):
            old_byte = new_byte
            new_byte = self.serial.read(1)

        package = self.serial.read(8)

        return package


    def readValues(self):
        package = self._readPackage()
        unpacked = struct.unpack('<HHxxBB', package)
        print("Package: {}. Unpacked: {}".format(package, unpacked))

        checksum = sum(package[:6]) & 255

        if checksum != package[6]:
            print("Checksums do not match. Calculated: {},  Recieved: {}".format(checksum, package[6]))
            return None, None
        if package[7] != 171:
            print("Recieved package did not end correctly.")
            return None, None

        pm_25 = unpacked[0] / 10
        pm_10 = unpacked[1] / 10
        return pm_25, pm_10

    def printValues(self):
        pm_25, pm_10 = sensor.readValues()
        print("PM2.5 value: {} μg/m^3, PM10 {} μg/m^3".format(pm_25, pm_10))


if __name__ == "__main__":
    sensor = PMSensor("/dev/cu.wchusbserial410")

    try:
        while True:
            sensor.printValues()
            time.sleep(5)
    except KeyboardInterrupt:
        print("Closing serial port...")
        sensor.close()
