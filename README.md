[![Docker Pulls](https://flat.badgen.net/docker/pulls/jakowenko/double-take)](https://hub.docker.com/r/jakowenko/double-take)

# Double Take

Process and train images with [DeepStack](https://deepstack.cc/), [CompreFace](https://github.com/exadel-inc/CompreFace), or [Facebox](https://machinebox.io) for facial recognition.

Double Take exposes a RESTful API or can subscribe to [Frigate's](https://github.com/blakeblackshear/frigate) MQTT topic to process events for facial recognition. When a Frigate event is received the API begins to process the `snapshot.jpg` and `latest.jpg` images from Frigate's API. Images are passed from the API to the detector(s) specified until a match is found above the defined confidence level. To improve the chances of finding a match, the processing of the images will repeat until the amount of retries is exhausted or a match is found. If a match is found the image is then saved to `/storage/matches/${frigate-event-id}-${image-type}.jpg`.

## API

### `GET - /recognize`

Process images for recognition with a `GET` request.

| Query Params | Default    | Description                                          |
| ------------ | ---------- | ---------------------------------------------------- |
| url          |            | URL of image to pass to facial recognition detectors |
| attempts     | `1`        | Number of attempts before stopping without a match   |
| results      | `best`     | Options: `best`, `all`                               |
| break        | `true`     | Break attempt loop if a match is found               |
| processing   | `parallel` | Options: `parallel`, `serial`                        |

**Sample Input**

`/recognize?url=https://your-image.com/sample.jpg`

**Sample Output**

```json
{
  "id": "9bd5134b-0c48-4bcf-a1f5-f09e660867bc",
  "duration": 1.33,
  "time": "03/15/2021 12:56:20 AM",
  "attempts": 1,
  "matches": [
    {
      "duration": 1.01,
      "name": "david",
      "confidence": 87.66,
      "attempt": 1,
      "detector": "compreface",
      "type": "manual"
    }
  ]
}
```

### `GET - /train/add/:name`

Train detectors with images from `./storage/train/:name`. Once an image is trained, it will not be reprocessed unless it is removed via the API.

### `GET - /train/remove/:name`

Remove all images for the specific name from detectors.

### `GET - /train/:camera/:name`

Train detectors with the `latest.jpg` image from a Frigate camera.

| Query Params | Default    | Description                                          |
| ------------ | ---------- | ---------------------------------------------------- |
| attempts     | `1`        | Number of `latest.jpg` images to use   |
| output     | `html`        | Options: `html`, `json`   |

## MQTT

Double Take has the ability to subscribe to Frigate's MQTT topic and process events as they are received.

If a match is found then a new topic will be created with the default format being `double-take/matches/:name`.

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
  --name=double-take \
  --restart=unless-stopped \
  -p 3000:3000 \
  -e DETECTORS=facebox \
  -e FRIGATE_URL=http://frigate-url.com \
  -e FACEBOX_URL=http://facebox-url.com \
  jakowenko/double-take
```

### Docker Compose

```yaml
version: '3.7'

services:
  double-take:
    container_name: double-take
    image: jakowenko/double-take
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
  double-take:
    container_name: double-take
    image: jakowenko/double-take
    restart: unless-stopped
    volumes:
      - ${PWD}/.storage:/.storage
    environment:
      DETECTORS: compreface, facebox
      MQTT_HOST: mqtt.server.com
      FRIGATE_URL: http://frigate-url.com
      FACEBOX_URL: http://facebox-url.com
      DEEPSTACK_URL: http://deepstack-url.com
      COMPREFACE_URL: http://compreface-url.com
      COMPREFACE_API_KEY: COMPREFACE-API-KEY
      SNAPSHOT_RETRIES: 20
      LATEST_RETRIES: 20
      CONFIDENCE: 65
    ports:
      - 3000:3000
```

## Options

Configurable options that can be passed as environment variables to the Docker container.
| Name | Default | Description |
|--|--|--|
| DETECTORS || Comma separated list of detectors to process images with: `compreface`, `deepstack`, `facebox` |
| PORT | `3000` | API port |
| MQTT_HOST || MQTT host address |
| MQTT_USERNAME || MQTT username |
| MQTT_PASSWORD || MQTT password |
| MQTT_TOPIC | `frigate/events` | MQTT topic for message subscription |
| MQTT_TOPIC_MATCHES | `double-take/matches` | MQTT topic where matches are published |
| DEEPSTACK_URL || Base URL for DeepStack API |
| FACEBOX_URL || Base URL for Facebox API |
| COMPREFACE_URL || Base URL for CompreFace API |
| FRIGATE_URL || Base URL for Frigate |
| FRIGATE_IMAGE_HEIGHT | `800` | Height of image passed for facial recognition |
| COMPREFACE_API_KEY || API Key for CompreFace collection |
| SNAPSHOT_RETRIES | `10` | Amount of times API will request a Frigate `snapshot.jpg` for analysis |
| LATEST_RETRIES | `10` | Amount of times API will request a Frigate `latest.jpg` for analysis |
| CONFIDENCE | `50` | Minimum confidence level for a face match |
| LOGS || Options: `verbose` |
