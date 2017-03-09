all:
	snapcraft clean
	ARCH=armhf snapcraft-docker

clean:
	snapcraft clean