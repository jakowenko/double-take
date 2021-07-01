[![Double Take](https://badgen.net/github/release/jakowenko/double-take/stable)](https://github.com/jakowenko/double-take) [![Double Take](https://badgen.net/github/stars/jakowenko/double-take)](https://github.com/jakowenko/double-take/stargazers) [![Docker Pulls](https://flat.badgen.net/docker/pulls/jakowenko/double-take)](https://hub.docker.com/r/jakowenko/double-take)

# Double Take

Unified UI and API for processing and training images for facial recognition.

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/124193519-f4ae2300-da94-11eb-9720-15f2e7579355.jpg" width="100%">
</p>

## Why?

There's a lot of great open source software to perform facial recognition, but each of them behave differently. Double Take was created to abstract the complexities of the detection services and combine them into an easy to use UI and API.

### Supported Detectors

- [DeepStack](https://deepstack.cc) v2021.02.1-2021.06.01
- [CompreFace](https://github.com/exadel-inc/CompreFace) v0.5.0-0.5.1
- [Facebox](https://machinebox.io)

### Supported NVRs

- [Frigate](https://github.com/blakeblackshear/frigate) v0.8.0-0.9.0

## Use Cases

### [Frigate](https://github.com/blakeblackshear/frigate)

Subscribe to Frigate's MQTT topics and process images for analysis.

```yaml
mqtt:
  host: 192.168.1.1

frigate:
  url: http://192.168.1.1:5000
```

When the `frigate/events` topic is updated the API begins to process the [`snapshot.jpg`](https://blakeblackshear.github.io/frigate/usage/api/#apieventsidsnapshotjpg) and [`latest.jpg`](https://blakeblackshear.github.io/frigate/usage/api/#apicamera_namelatestjpgh300) images from Frigate's API. These images are passed from the API to the configured detector(s) until a match is found that meets the configured requirements. To improve the chances of finding a match, the processing of the images will repeat until the amount of retries is exhausted or a match is found.

When the `frigate/+/person/snapshot` topic is updated the API will process that image with the configured detector(s). It is recommended to increase the MQTT snapshot size in the [Frigate camera config](https://blakeblackshear.github.io/frigate/configuration/cameras#full-example).

```yaml
cameras:
  front-door:
    mqtt:
      timestamp: False
      bounding_box: False
      crop: True
      height: 500
```

If a match is found the image is saved to `/.storage/matches/${filename}`.

### [Home Assistant](https://www.home-assistant.io)

Trigger automations / notifications when images are processed.

If the MQTT integration is configured within Home Assistant, then sensors can be created from the topics that Double Take publishes to.

```yaml
sensor:
  - platform: mqtt
    name: David
    icon: mdi:account
    state_topic: 'double-take/matches/david'
    json_attributes_topic: 'double-take/matches/david'
    value_template: '{{ value_json.camera }}'
    availability_topic: 'double-take/available'
```

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505698-904ec780-a889-11eb-825e-b641203d9e95.jpg" width="70%">
</p>

## Notify Services

### [Gotify](https://gotify.net)

```yaml
notify:
  gotify:
    url: http://192.168.1.1:8080
    token: XXXXXXX
```

## UI

The UI is accessible from `http://localhost:3000/#/`.

### `/#/config`

Make changes to the configuration and restart the API.

### `/#/files`

View files and training results from detectors.

## API

### `GET - /api/config`

Output configuration.

```shell
curl -X GET "http://localhost:3000/api/config" \
-H "Content-type: application/json"
```

```json
{
  "confidence": { "match": 60, "unknown": 40 },
  "detectors": {
    "compreface": {
      "url": "http://192.168.1.1:8000",
      "key": "xxx-xxx-xxx-xxx-xxx"
    },
    "deepstack": { "url": "http://192.168.1.1:8001" },
    "facebox": { "url": "http://192.168.1.1:8002" }
  },
  "frigate": {
    "attempts": { "latest": 10, "snapshot": 0 },
    "image": { "height": 500 },
    "url": "http://192.168.1.1:5000",
    "cameras": [],
    "zones": []
  },
  "mqtt": {
    "topics": {
      "frigate": "frigate/events",
      "matches": "double-take/matches",
      "cameras": "double-take/cameras"
    },
    "host": "192.168.1.1"
  },
  "objects": { "face": { "min_area_match": 10000 } },
  "purge": { "matches": 168, "unknown": 8 },
  "save": { "matches": true, "unknown": true },
  "server": { "port": 3000 },
  "storage": { "path": "./.storage" },
  "time": { "timezone": "UTC", "format": "F" }
}
```

### `GET - /api/recognize`

Process image for recognition.

| Query Params | Default       | Description                                          |
| ------------ | ------------- | ---------------------------------------------------- |
| url          |               | URL of image to pass to facial recognition detectors |
| attempts     | `1`           | Number of attempts before stopping without a match   |
| results      | `best`        | Options: `best`, `all`                               |
| break        | `true`        | Break attempt loop if a match is found               |
| camera       | `double-take` | Camera name used in output results                   |

```shell
curl -X GET "http://localhost:3000/api/recognize?url=https://jakowenko.com/img/david.92f395c6.jpg" \
-H "Content-type: application/json"
```

```json
{
  "id": "fd0d91ee-1ecc-4b93-aee4-4e6523090f9a",
  "duration": 4.04,
  "timestamp": "2021-04-28T13:12:06.624-04:00",
  "attempts": 1,
  "camera": "double-take",
  "zones": [],
  "matches": [
    {
      "name": "david",
      "confidence": 100,
      "match": true,
      "box": { "top": 286, "left": 744, "width": 319, "height": 397 },
      "type": "manual",
      "detector": "compreface",
      "duration": 0.92,
      "filename": "e4f181f2-21bd-4aa3-a2a8-9b7730d9d9dd.jpg"
    }
  ]
}
```

### `GET - /api/recognize/test`

Process test image for recognition and output the configured detectors raw response.

```shell
curl -X GET "http://localhost:3000/api/recognize/test" \
-H "Content-type: application/json"
```

```json
[
  {
    "detector": "deepstack",
    "response": {
      "success": true,
      "predictions": [
        {
          "confidence": 0.0260843,
          "userid": "david",
          "y_min": 194,
          "x_min": 215,
          "y_max": 392,
          "x_max": 358
        }
      ],
      "duration": 0
    }
  },
  {
    "detector": "compreface",
    "response": {
      "result": [
        {
          "box": {
            "probability": 0.93259,
            "x_max": 369,
            "y_max": 412,
            "x_min": 190,
            "y_min": 165
          },
          "subjects": [{ "subject": "david", "similarity": 0.03813 }]
        }
      ]
    }
  },
  {
    "detector": "facebox",
    "response": {
      "success": true,
      "facesCount": 1,
      "faces": [
        {
          "rect": { "top": 219, "left": 218, "width": 155, "height": 155 },
          "matched": false,
          "confidence": 0
        }
      ]
    }
  }
]
```

### `GET - /api/cameras/:camera`

Process images via HTTP or MQTT for configured cameras.

| Query Params | Default | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| attempts     | `1`     | Number of attempts before stopping without a match |
| break        | `true`  | Break attempt loop if a match is found             |

```yaml
cameras:
  driveway:
    snapshot:
      topic: driveway/snapshot
      url: http://192.168.1.1/latest.jpg
```

```shell
curl -X GET "http://localhost:3000/api/cameras/driveway" \
-H "Content-type: application/json"
```

```json
{
  "id": "01da75f4-47c5-4558-bc48-d6a90ddc9f05",
  "duration": 1.41,
  "timestamp": "2021-06-28T04:10:21.485Z",
  "attempts": 1,
  "camera": "driveway",
  "zones": [],
  "matches": [
    {
      "name": "david",
      "confidence": 100,
      "match": true,
      "box": { "top": 91, "left": 145, "width": 101, "height": 135 },
      "type": "camera-event",
      "duration": 0.83,
      "detector": "deepstack",
      "filename": "bd7b3ed5-4a9a-46e9-a162-d73e4ca58f1f.jpg"
    }
  ]
}
```

### `GET - /api/train/add/:name`

Train detectors with images from `./storage/train/${name}`. Once an image is trained, it will not be reprocessed unless it is removed via the API.

```shell
curl -X GET "http://localhost:3000/api/train/add/david" \
-H "Content-type: application/json"
```

```json
{
  "message": "training queued for david using 2 image(s): check logs for details"
}
```

### `GET - /api/train/remove/:name`

Remove all images for the specific name from detectors. This does not delete the files from the training folder.

```shell
curl -X GET "http://localhost:3000/api/train/remove/david" \
-H "Content-type: application/json"
```

```json
[
  {
    "detector": "compreface",
    "results": [{ "image_id": "46f0db76-38ec-4b50-b8c7-de7d4080517d", "subject": "david" }]
  },
  { "detector": "deepstack", "results": { "success": true, "duration": 0 } },
  { "detector": "facebox", "results": { "success": true } }
]
```

### `GET - /api/storage/matches/:filename`

Render match image.

| Query Params | Default | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| box          | `false` | Draw bounding box around face with name and confidence. |

## MQTT

Publish results to `double-take/matches/${name}` and `double-take/cameras/${camera}`. The number of results will also be published to `double-take/cameras/${camera}/person` and will reset back to `0` after 30 seconds.

```yaml
mqtt:
  host: 192.168.1.1
```

**double-take/matches/david**

```json
{
  "id": "1623906078.684285-5l9hw6",
  "duration": 1.26,
  "timestamp": "2021-06-17T05:01:36.030Z",
  "attempts": 3,
  "camera": "living-room",
  "zones": [],
  "match": {
    "name": "david",
    "confidence": 66.07,
    "match": true,
    "box": { "top": 308, "left": 1018, "width": 164, "height": 177 },
    "type": "latest",
    "duration": 0.28,
    "detector": "compreface",
    "filename": "2f07d1ad-9252-43fd-9233-2786a36a15a9.jpg"
  }
}
```

**double-take/cameras/back-door**

```json
{
  "id": "ff894ff3-2215-4cea-befa-43fe00898b65",
  "duration": 4.25,
  "timestamp": "2021-06-17T03:19:55.695Z",
  "attempts": 5,
  "camera": "back-door",
  "zones": [],
  "matches": [
    {
      "name": "david",
      "confidence": 100,
      "match": true,
      "box": { "top": 286, "left": 744, "width": 319, "height": 397 },
      "type": "manual",
      "duration": 0.8,
      "detector": "compreface",
      "filename": "4d8a14a9-96c5-4691-979b-0f2325311453.jpg"
    }
  ]
}
```

## Usage

### Docker Run

```shell
docker run -d \
  --name=double-take \
  --restart=unless-stopped \
  -p 3000:3000 \
  -v ${PWD}/config.yml:/double-take/config.yml \
  -v ${PWD}/.storage:/.storage \
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
    volumes:
      - ${PWD}/config.yml:/double-take/config.yml
      - ${PWD}/.storage:/.storage
    ports:
      - 3000:3000
```

## Configuration

Configurable options that can be passed by mounting a file at `/double-take/config.yml` and is editable via the UI at `http://localhost:3000/#/config`. _Default values do not need to be specified in configuration unless they need to be overwritten._

```yaml
server:
  port: 3000

mqtt:
  host: 192.168.1.1
  topics:
    frigate: frigate/events
    matches: double-take/matches
    cameras: double-take/cameras

confidence:
  match: 60
  unknown: 40

objects:
  face:
    min_area_match: 10000

save:
  matches: true
  unknown: true

purge:
  matches: 168
  unknown: 8

frigate:
  url: http://192.168.1.1:5000
  image:
    height: 500
  attempts:
    latest: 10
    snapshot: 0
  cameras:
    - frontdoor
    - backyard
  zones:
    - camera: driveway
      zone: zone-1

cameras:
  driveway:
    snapshot:
      topic: driveway/snapshot
      url: http://192.168.1.1/latest.jpg

detectors:
  compreface:
    url: http://192.168.1.1:8000
    key: xxx-xxx-xxx-xxx-xxx # key from recognition service in created app
  deepstack:
    url: http://192.168.1.1:8001
    key: xxx-xxx-xxx-xxx-xxx # optional api key
  facebox:
    url: http://192.168.1.1:8002

time:
  format: F
  timezone: America/Detroit
```

| Option                             | Default               | Description                                                                                                                                       |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| server.port                        | `3000`                | API Port                                                                                                                                          |
| mqtt.host                          |                       | MQTT host                                                                                                                                         |
| mqtt.username                      |                       | MQTT username                                                                                                                                     |
| mqtt.password                      |                       | MQTT password                                                                                                                                     |
| mqtt.topics.frigate                | `frigate/events`      | MQTT topic for Frigate message subscription                                                                                                       |
| mqtt.topics.matches                | `double-take/matches` | MQTT topic where matches are published                                                                                                            |
| mqtt.topics.cameras                | `double-take/cameras` | MQTT topic where matches are published by camera name                                                                                             |
| confidence.match                   | `60`                  | Minimum confidence needed to consider a result a match                                                                                            |
| confidence.unknown                 | `40`                  | Minimum confidence needed before classifying a match name as unknown                                                                              |
| objects.face.min_area_match        | `10000`               | Minimum area in pixels to consider a result a match                                                                                               |
| save.matches                       | `true`                | Save match images                                                                                                                                 |
| save.unknown                       | `true`                | Save unknown images                                                                                                                               |
| purge.matches                      | `168`                 | Hours to keep match images until they are deleted                                                                                                 |
| purge.unknown                      | `8`                   | Hours to keep unknown images until they are deleted                                                                                               |
| frigate.url                        |                       | Base URL for Frigate                                                                                                                              |
| frigate.attempts.latest            | `10`                  | Amount of times API will request a Frigate `latest.jpg` for facial recognition                                                                    |
| frigate.attempts.snapshot          | `0`                   | Amount of times API will request a Frigate `snapshot.jpg` for facial recognition                                                                  |
| frigate.image.height               | `500`                 | Height of Frigate image passed for facial recognition                                                                                             |
| frigate.cameras                    |                       | Only process images from specific cameras                                                                                                         |
| frigate.zones                      |                       | Only process images from specific zones                                                                                                           |
| cameras.camera-name.snapshot.topic |                       | Process jpeg encoded topic for facial recognition                                                                                                 |
| cameras.camera-name.snapshot.url   |                       | Process HTTP image for facial recognition                                                                                                         |
| detectors.compreface.url           |                       | Base URL for CompreFace API                                                                                                                       |
| detectors.compreface.key           |                       | API Key for CompreFace collection                                                                                                                 |
| detectors.compreface.face_plugins  |                       | Comma-separated slugs of [face plugins](https://github.com/exadel-inc/CompreFace/blob/master/docs/Face-services-and-plugins.md)                   |
| detectors.deepstack.url            |                       | Base URL for DeepStack API                                                                                                                        |
| detectors.deepstack.key            |                       | API Key for DeepStack                                                                                                                             |
| detectors.facebox.url              |                       | Base URL for Facebox API                                                                                                                          |
| notify.gotify.url                  |                       | Base URL for Gotify                                                                                                                               |
| notify.gotify.token                |                       | Gotify application token Gotify                                                                                                                   |
| notify.gotify.priority             | `5`                   | Gotify message priority                                                                                                                           |
| notify.gotify.cameras              |                       | Only notify from specific cameras                                                                                                                 |
| notify.gotify.zones                |                       | Only notify from specific zones                                                                                                                   |
| time.format                        |                       | Defaults to ISO 8601 format with support for [token-based formatting](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) |
| time.timezone                      | `UTC`                 | Time zone used in logs                                                                                                                            |

## Known Issues

In rare scenarios, requesting images from Frigate's API causes Frigate to crash. There is an [open issue](https://github.com/blakeblackshear/frigate/discussions/853) with more information, but it appears sometimes the database connection isn't being closed in time causing Frigate's API to crash. This appears to be related to processing the `snapshot.jpg`. Setting `frigate.attempts.snapshot` to `0` will disable the processing of that image.
