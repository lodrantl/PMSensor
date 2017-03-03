FROM python:3.5-alpine
MAINTAINER Luka Lodrant

RUN mkdir /opt/pmsensor

ADD dbwriter.py /opt/pmsensor/
ADD pmreader.py /opt/pmsensor/
ADD pmsensor.docker.ini /opt/pmsensor/pmsensor.ini

CMD ["/usr/bin/python3", "/opt/pmsensor/dbwriter.py"]
