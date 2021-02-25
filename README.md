# Frigate Events

Process [Frigate](https://github.com/blakeblackshear/frigate) images with [Facebox](https://machinebox.io) and/or [CompreFace](https://github.com/exadel-inc/CompreFace).

## Docker Run

```shell
docker run -d \
  --name=frigate-events \
  -p 3000:3000 \
  -e FRIGATE_URL=http://YOUR-FRIGATE-URL.com \
  -e FACEBOX_URL=http://YOUR-FACEBOX-URL.com \
  jakowenko/frigate-events
```

## Docker Compose

```yaml
version: '3.7'

services:
  frigate-events:
    container_name: frigate-events
    image: jakowenko/frigate-events
    environment:
      FRIGATE_URL: http://YOUR-FRIGATE-URL.com
      FACEBOX_URL: http://YOUR-FACEBOX-URL.com
    ports:
      - 3000:3000
```

## Options

Configurable options that can be passed an environment variables to the docker container.
| Name | Default | Description |
|--|--|--|
| DETECTORS || Comma seperated list of dectors to use: compreface, facebox
| PORT | `3000` | API port |
| MQTT_HOST || MQTT host address |
| MQTT_TOPIC | `frigate/events` | MQTT topic for message subscription |
| MQTT_TOPIC_MATCHES | `frigate-events/matches` | MQTT topic where matches are published |
| FACEBOX_URL || Base URL for Facebox API |
| COMPREFACE_URL || Base URL for CompreFace API |
| FRIGATE_URL || Base URL for Frigate |
| COMPREFACE_API_KEY || API Key for CompreFace collection |
| SNAPSHOT_RETRIES | `10` | Amount of times API will request a Frigate snapshot.jpg for analysis |
| LATEST_RETRIES | `10` | Amount of times API will request a Frigate latest.jpg for analysis |
| CONFIDENCE | `50` | Minimum confidence level for a face match |
