#!/bin/bash

HOST=192.168.13.18:8088
TMPDIR=/tmp/idbsnapshot

influxd backup -database pm -host $HOST $TMPDIR

influxd restore -datadir /var/lib/influxdb/data -database pm $TMPDIR

systemctl restart influxdb