[![Docker Pulls](https://flat.badgen.net/docker/pulls/jakowenko/double-take)](https://hub.docker.com/r/jakowenko/double-take)

# Double Take

Unified UI and API for processing and training images for facial recognition.

### Supported Detectors

- [DeepStack](https://deepstack.cc) v1.2.1
- [CompreFace](https://github.com/exadel-inc/CompreFace) v0.5.0
- [Facebox](https://machinebox.io)

## Use Cases

### [Frigate](https://github.com/blakeblackshear/frigate)

Subscribe to Frigate's MQTT events topic and process images from the event for analysis.

When a Frigate event is received the API begins to process the [`snapshot.jpg`](https://blakeblackshear.github.io/frigate/usage/api/#apieventsidsnapshotjpg) and [`latest.jpg`](https://blakeblackshear.github.io/frigate/usage/api/#apicamera_namelatestjpgh300) images from Frigate's API. These images are passed from the API to the detector(s) specified until a match is found above the defined confidence level. To improve the chances of finding a match, the processing of the images will repeat until the amount of retries is exhausted or a match is found. If a match is found the image is then saved to `/.storage/matches/:filename`.

### [Home Assistant](https://www.home-assistant.io) + [Node-Red](https://nodered.org)

Double Take can be paired with Home Assistant and Node-Red to create automations when matches are detected.

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505698-904ec780-a889-11eb-825e-b641203d9e95.jpg" width="70%">
</p>

More information for this can be found in the [docs](https://github.com/jakowenko/double-take/tree/master/docs/home-assistant-node-red.md).

## UI

The UI is accessible from `http://localhost:3000`.

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505792-cc822800-a889-11eb-91f3-f6a192767aa8.png" width="70%">
</p>

## API

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

### `GET - /api/train/add/:name`

Train detectors with images from `./storage/train/:name`. Once an image is trained, it will not be reprocessed unless it is removed via the API.

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
    "results": [
      { "image_id": "46f0db76-38ec-4b50-b8c7-de7d4080517d", "subject": "david" }
    ]
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

If MQTT is enabled and a match is found then two topics will be created.

- `double-take/matches/:name`
- `double-take/cameras/:camera`

**double-take/matches/david**

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

**double-take/cameras/back-door**

```json
{
  "id": "ff894ff3-2215-4cea-befa-43fe00898b65",
  "duration": 4.25,
  "timestamp": "4/29/2021, 12:29:53 AM",
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
version: "3.7"

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

Configurable options that can be passed by mounting a file at `/double-take/config.yml`.

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

save:
  matches: true
  unknown: true

purge:
  matches: 168
  unknown: 8

frigate:
  url: http://192.168.1.1:4000
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
      name: zone-1

detectors:
  compreface:
    url: http://192.168.1.1:8000
    key: xxx-xxx-xxx-xxx-xxx
  deepstack:
    url: http://192.168.1.1:8001
  facebox:
    url: http://192.168.1.1:8002

time:
  format: F
  timezone: America/Detroit
```

| Option                    | Default               | Description                                                                                                                                       |
| ------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| server.port               | `3000`                | API Port                                                                                                                                          |
| mqtt.host                 |                       | MQTT host                                                                                                                                         |
| mqtt.username             |                       | MQTT username                                                                                                                                     |
| mqtt.password             |                       | MQTT password                                                                                                                                     |
| mqtt.topics.frigate       | `frigate/events`      | MQTT topic for Frigate message subscription                                                                                                       |
| mqtt.topics.matches       | `double-take/matches` | MQTT topic where matches are published                                                                                                            |
| mqtt.topics.cameras       | `double-take/cameras` | MQTT topic where matches are published by camera name                                                                                             |
| confidence.match          | `60`                  | Minimum confidence needed to consider a result a match                                                                                            |
| confidence.unknown        | `40`                  | Minimum confidence needed before classifying a match name as unknown                                                                              |
| save.matches              | `true`                | Save match images                                                                                                                                 |
| save.unknown              | `true`                | Save unknown images                                                                                                                               |
| purge.matches             | `168`                 | Hours to keep match images until they are deleted                                                                                                 |
| purge.unknown             | `8`                   | Hours to keep unknown images until they are deleted                                                                                               |
| frigate.url               |                       | Base URL for Frigate                                                                                                                              |
| frigate.attempts.latest   | `10`                  | Amount of times API will request a Frigate `latest.jpg` for analysis                                                                              |
| frigate.attempts.snapshot | `0`                   | Amount of times API will request a Frigate `snapshot.jpg` for analysis                                                                            |
| frigate.image.height      | `500`                 | Height of Frigate image passed for facial recognition                                                                                             |
| frigate.cameras           |                       | Only process images from specific cameras                                                                                                         |
| frigate.zones             |                       | Only process images from specific zones                                                                                                           |
| detectors.compreface.url  |                       | Base URL for CompreFace API                                                                                                                       |
| detectors.compreface.key  |                       | API Key for CompreFace collection                                                                                                                 |
| detectors.deepstack.url   |                       | Base URL for DeepStack API                                                                                                                        |
| detectors.facebox.url     |                       | Base URL for Facebox API                                                                                                                          |
| time.format               |                       | Defaults to ISO 8601 format with support for [token-based formatting](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) |
| time.timezone             | `UTC`                 | Time zone used in logs                                                                                                                            |

## Known Issues

In rare scenarios, requesting images from Frigate's API causes Frigate to crash. There is an [open issue](https://github.com/blakeblackshear/frigate/discussions/853) with more information, but it appears sometimes the database connection isn't being closed in time causing Frigate's API to crash. Double Take does use random jitter up to 1 second before all Frigate API requests to help reduce the likelihood of the API crashing. This appears to be related to processing the `snapshot.jpg`. Setting `frigate.attempts.snapshot` to `0` will disable the processing of that image.
