[![Docker Pulls](https://flat.badgen.net/docker/pulls/jakowenko/frigate-events)](https://hub.docker.com/r/jakowenko/frigate-events)

# Frigate Events

Process [Frigate](https://github.com/blakeblackshear/frigate) images with [Facebox](https://machinebox.io) and/or [CompreFace](https://github.com/exadel-inc/CompreFace).

Frigate Events exposes a RESTful endpoint and/or can subscribe to Frigate's MQTT topic to process events for facial recognition. When an event is received the API begins to process the `snapshot.jpg` and `latest.jpg` images from Frigate's API. Images are passed from the API to the detector(s) specified until a match is found above the defined confidence level. To improve the chances of finding a match, the processing of the images will repeat until the amount of retries is exhausted or a match is found. If a match is found the image is then saved to `/storage/matches/${frigate-event-id}-${image-type}.jpg`.

## API

Frigate Events exposes a `/recognize` endpoint where Frigate MQTT events can be POSTed to for processing.

**Sample Payload**

```json
{
  "before": {
    "camera": "living-room",
    "label": "person",
    "score": ".60",
    "id": "1614048341.992271-6jkzwi"
  },
  "type": "start",
  ...
}
```

**Sample Response Body**

```json
{
  "id": "1614048341.992271-6jkzwi",
  "duration": 0.78,
  "time": "03/05/2021 02:54:55 AM",
  "attempts": 16,
  "camera": "living-room",
  "room": "Living Room",
  "matches": [
    {
      "name": "david",
      "confidence": 77.12,
      "attempt": 1,
      "detector": "facebox",
      "type": "latest",
      "duration": 0.78
    }
  ]
}
```

## MQTT

Frigate Events has the ability to subscribe to Frigate's MQTT topic and process events as they are received.

If a match is found then a new topic will be created with the default format being `frigate-events/matches/${name}`.

**Sample Topic Value**

```json
{
  "id": "1614931108.689332-6uu8kk",
  "duration": 0.85,
  "time": "03/05/2021 02:58:57 AM",
  "attempts": 4,
  "camera": "living-room",
  "room": "Living Room",
  "match": {
    "name": "david",
    "confidence": 82.6,
    "attempt": 1,
    "detector": "compreface",
    "type": "snapshot",
    "duration": 0.39
  }
}
```

## Basic Usage

### Docker Run

```shell
docker run -d \
  --name=frigate-events \
  --restart=unless-stopped \
  -p 3000:3000 \
  -e DETECTORS=facebox \
  -e FRIGATE_URL=http://frigate-url.com \
  -e FACEBOX_URL=http://facebox-url.com \
  jakowenko/frigate-events
```

### Docker Compose

```yaml
version: '3.7'

services:
  frigate-events:
    container_name: frigate-events
    image: jakowenko/frigate-events
    restart: unless-stopped
    environment:
      DETECTORS: facebox
      FRIGATE_URL: http://frigate-url.com
      FACEBOX_URL: http://facebox-url.com
    ports:
      - 3000:3000
```

## More Advanced Usage

### Docker Compose

```yaml
version: '3.7'

services:
  frigate-events:
    container_name: frigate-events
    image: jakowenko/frigate-events
    restart: unless-stopped
    volumes:
      - ${PWD}/.storage:/.storage
    environment:
      DETECTORS: compreface, facebox
      MQTT_HOST: mqtt.server.com
      FRIGATE_URL: http://frigate-url.com
      FACEBOX_URL: http://facebox-url.com
      COMPREFACE_URL: http://compreface-url.com
      COMPREFACE_API_KEY: COMPREFACE-API-KEY
      SNAPSHOT_RETRIES: 20
      LATEST_RETRIES: 20
      CONFIDENCE: 65
    ports:
      - 3000:3000
```

## Options

Configurable options that can be passed an environment variables to the Docker container.
| Name | Default | Description |
|--|--|--|
| DETECTORS || Comma seperated list of dectors to process images with: `compreface`, `facebox` |
| PORT | `3000` | API port |
| MQTT_HOST || MQTT host address |
| MQTT_USERNAME || MQTT username |
| MQTT_PASSWORD || MQTT password |
| MQTT_TOPIC | `frigate/events` | MQTT topic for message subscription |
| MQTT_TOPIC_MATCHES | `frigate-events/matches` | MQTT topic where matches are published |
| FACEBOX_URL || Base URL for Facebox API |
| COMPREFACE_URL || Base URL for CompreFace API |
| FRIGATE_URL || Base URL for Frigate |
| COMPREFACE_API_KEY || API Key for CompreFace collection |
| SNAPSHOT_RETRIES | `10` | Amount of times API will request a Frigate `snapshot.jpg` for analysis |
| LATEST_RETRIES | `10` | Amount of times API will request a Frigate `latest.jpg` for analysis |
| CONFIDENCE | `50` | Minimum confidence level for a face match |
| LOGS || Options: `verbose` |
