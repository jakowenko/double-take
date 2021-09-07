[![Double Take](https://badgen.net/github/release/jakowenko/double-take/stable)](https://github.com/jakowenko/double-take) [![Double Take](https://badgen.net/github/stars/jakowenko/double-take)](https://github.com/jakowenko/double-take/stargazers) [![Docker Pulls](https://flat.badgen.net/docker/pulls/jakowenko/double-take)](https://hub.docker.com/r/jakowenko/double-take) [![Discord](https://flat.badgen.net/discord/members/3pumsskdN5?label=Discord)](https://discord.gg/3pumsskdN5)

# Double Take

Unified UI and API for processing and training images for facial recognition.

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/126434926-cf2275f7-f3a8-43eb-adc2-903c0071f7d1.jpg" width="100%">
</p>

## Why?

There's a lot of great open source software to perform facial recognition, but each of them behave differently. Double Take was created to abstract the complexities of the detection services and combine them into an easy to use UI and API.

## Features

- UI and API bundled into single Docker image
- Ability to password protect UI and API
- Support for multiple detectors
- Train and untrain images for subjects
- Process images from NVRs
- Publish results to MQTT topics
- REST API can be invoked by other applications

### Supported Detectors

- [DeepStack](https://deepstack.cc) v2021.02.1-2021.06.01
- [CompreFace](https://github.com/exadel-inc/CompreFace) v0.5.0-0.5.1
- [Facebox](https://machinebox.io)

### Supported NVRs

- [Frigate](https://github.com/blakeblackshear/frigate) v0.8.0-0.9.0

## Integrations

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

If the MQTT integration is configured within Home Assistant, then sensors will automatically be created.

#### Notification Automation

This notification will work for both matches and unknown results. The message can be customized with any of the attributes from the entity.

```yaml
alias: Notify
trigger:
  - platform: state
    entity_id: sensor.double_take_david
  - platform: state
    entity_id: sensor.double_take_unknown
condition:
  - condition: template
    value_template: '{{ trigger.to_state.state != trigger.from_state.state }}'
action:
  - service: notify.mobile_app
    data:
      message: |-
        {% if trigger.to_state.attributes.match is defined %}
          {{trigger.to_state.attributes.friendly_name}} is near the {{trigger.to_state.state}} @ {{trigger.to_state.attributes.match.confidence}}% by {{trigger.to_state.attributes.match.detector}}:{{trigger.to_state.attributes.match.type}} taking {{trigger.to_state.attributes.attempts}} attempt(s) @ {{trigger.to_state.attributes.duration}} sec
        {% elif trigger.to_state.attributes.unknown is defined %}
          unknown is near the {{trigger.to_state.state}} @ {{trigger.to_state.attributes.unknown.confidence}}% by {{trigger.to_state.attributes.unknown.detector}}:{{trigger.to_state.attributes.unknown.type}} taking {{trigger.to_state.attributes.attempts}} attempt(s) @ {{trigger.to_state.attributes.duration}} sec
        {% endif %}
      data:
        attachment:
          url: |-
            {% if trigger.to_state.attributes.match is defined %}
              http://192.168.1.2:3000/api/storage/matches/{{trigger.to_state.attributes.match.filename}}?box=true&token={{trigger.to_state.attributes.token}}
            {% elif trigger.to_state.attributes.unknown is defined %}
               http://192.168.1.2:3000/api/storage/matches/{{trigger.to_state.attributes.unknown.filename}}?box=true&token={{trigger.to_state.attributes.token}}
            {% endif %}
        actions:
          - action: URI
            title: View Image
            uri: |-
              {% if trigger.to_state.attributes.match is defined %}
                http://192.168.1.2:3000/api/storage/matches/{{trigger.to_state.attributes.match.filename}}?box=true&token={{trigger.to_state.attributes.token}}
              {% elif trigger.to_state.attributes.unknown is defined %}
                 http://192.168.1.2:3000/api/storage/matches/{{trigger.to_state.attributes.unknown.filename}}?box=true&token={{trigger.to_state.attributes.token}}
              {% endif %}
mode: parallel
max: 10
```

### MQTT

Publish results to `double-take/matches/${name}` and `double-take/cameras/${camera}`. The number of results will also be published to `double-take/cameras/${camera}/person` and will reset back to `0` after 30 seconds.

Errors from the API will be published to `double-take/errors`.

```yaml
mqtt:
  host: 192.168.1.1
```

#### double-take/matches/david

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

#### double-take/cameras/back-door

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

## Notify Services

### [Gotify](https://gotify.net)

```yaml
notify:
  gotify:
    url: http://192.168.1.1:8080
    token: XXXXXXX
```

## UI

The UI is accessible from `http://localhost:3000`.

- Matches: `/`
- Train: `/train`
- Config: `/config`
- Access Tokens: `/tokens` (_if authentication is enabled_)

## Authentication

Enable authentication to password protect the UI. This is recommended if running Double Take behind a reverse proxy which is exposed to the internet.

```yaml
auth: true
```

## API

Documentation can be viewed on [Postman](https://documenter.getpostman.com/view/1013188/TzsWuAa8).

## Usage

### Docker Run

```shell
docker run -d \
  --name=double-take \
  --restart=unless-stopped \
  -p 3000:3000 \
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
      - ${PWD}/.storage:/.storage
    ports:
      - 3000:3000
```

## Configuration

Configurable options that can be passed by mounting a file at `/double-take/config.yml` and is editable via the UI at `http://localhost:3000/#/config`. _Default values do not need to be specified in configuration unless they need to be overwritten._

```yaml
mqtt:
  host: 192.168.1.1

frigate:
  url: http://192.168.1.1:5000

detectors:
  compreface:
    url: http://192.168.1.1:8000
    key: xxx-xxx-xxx-xxx-xxx # key from recognition service in created app
  deepstack:
    url: http://192.168.1.1:8001
    key: xxx-xxx-xxx-xxx-xxx # optional api key
  facebox:
    url: http://192.168.1.1:8002
```

| Option                                  | Default               | Description                                                                                                                                       |
| --------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth                                    | `false`               | Add authentication to UI and API                                                                                                                  |
| mqtt.host                               |                       | MQTT host                                                                                                                                         |
| mqtt.username                           |                       | MQTT username                                                                                                                                     |
| mqtt.password                           |                       | MQTT password                                                                                                                                     |
| mqtt.topics.frigate                     | `frigate/events`      | MQTT topic for Frigate message subscription                                                                                                       |
| mqtt.topics.homeassistant               | `homeassistant`       | MQTT topic for Home Assistant Discovery subscription                                                                                              |
| mqtt.topics.matches                     | `double-take/matches` | MQTT topic where matches are published                                                                                                            |
| mqtt.topics.cameras                     | `double-take/cameras` | MQTT topic where matches are published by camera name                                                                                             |
| confidence.match                        | `60`                  | Minimum confidence needed to consider a result a match                                                                                            |
| confidence.unknown                      | `40`                  | Minimum confidence needed before classifying a match name as unknown                                                                              |
| objects.face.min_area_match             | `10000`               | Minimum area in pixels to consider a result a match                                                                                               |
| save.matches                            | `true`                | Save match images                                                                                                                                 |
| save.unknown                            | `true`                | Save unknown images                                                                                                                               |
| save.base64                             | `false`               | Include Base64 encoded string in API results and MQTT messages. Options include: `true`, `false`, or `box`.                                       |
| purge.matches                           | `168`                 | Hours to keep match images until they are deleted                                                                                                 |
| purge.unknown                           | `8`                   | Hours to keep unknown images until they are deleted                                                                                               |
| frigate.url                             |                       | Base URL for Frigate                                                                                                                              |
| frigate.attempts.latest                 | `10`                  | Amount of times API will request a Frigate `latest.jpg` for facial recognition                                                                    |
| frigate.attempts.snapshot               | `0`                   | Amount of times API will request a Frigate `snapshot.jpg` for facial recognition                                                                  |
| frigate.attempts.mqtt                   | `true`                | Process Frigate images from `frigate/+/person/snapshot` topics                                                                                    |
| frigate.attempts.delay                  | `0`                   | Add a delay expressed in seconds between each detection loop                                                                                      |
| frigate.image.height                    | `500`                 | Height of Frigate image passed for facial recognition                                                                                             |
| frigate.cameras                         |                       | Only process images from specific cameras                                                                                                         |
| frigate.zones                           |                       | Only process images from specific zones                                                                                                           |
| cameras.camera-name.snapshot.topic      |                       | Process jpeg encoded topic for facial recognition                                                                                                 |
| cameras.camera-name.snapshot.url        |                       | Process HTTP image for facial recognition                                                                                                         |
| detectors.compreface.url                |                       | Base URL for CompreFace API                                                                                                                       |
| detectors.compreface.key                |                       | API Key for CompreFace collection                                                                                                                 |
| detectors.compreface.det_prob_threshold | `0.8`                 | Minimum required confidence that a recognized face is actually a face. Value is between `0.0` and `1.0`                                           |
| detectors.compreface.face_plugins       |                       | Comma-separated slugs of [face plugins](https://github.com/exadel-inc/CompreFace/blob/master/docs/Face-services-and-plugins.md)                   |
| detectors.deepstack.url                 |                       | Base URL for DeepStack API                                                                                                                        |
| detectors.deepstack.key                 |                       | API Key for DeepStack                                                                                                                             |
| detectors.facebox.url                   |                       | Base URL for Facebox API                                                                                                                          |
| notify.gotify.url                       |                       | Base URL for Gotify                                                                                                                               |
| notify.gotify.token                     |                       | Gotify application token Gotify                                                                                                                   |
| notify.gotify.priority                  | `5`                   | Gotify message priority                                                                                                                           |
| notify.gotify.cameras                   |                       | Only notify from specific cameras                                                                                                                 |
| notify.gotify.zones                     |                       | Only notify from specific zones                                                                                                                   |
| time.format                             |                       | Defaults to ISO 8601 format with support for [token-based formatting](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) |
| time.timezone                           | `UTC`                 | Time zone used in logs                                                                                                                            |

## Donations

If you would like to make a donation to support development, please use [GitHub Sponsors](https://github.com/sponsors/jakowenko).
