# [Home Assistant](https://www.home-assistant.io) + [Node-Red](https://nodered.org)

Create dynamic Home-Assistant entities when matches are detected and send a notification with a picture of the match.

## By Name

- MQTT in Node

  - Topic: `double-take/matches/:name`
  - QoS: `0`
  - Output: `a parsed JSON object`

- Home Assistant Entity Node
  - Type: `sensor`
  - State: `msg.payload.camera`

_Any of the properties from the [MQTT](https://github.com/jakowenko/double-take#mqtt) message can be set as attributes on the node._

## By Camera

- MQTT in Node

  - Topic: `double-take/camera/:camera`
  - QoS: `0`
  - Output: `a parsed JSON object`

- Home Assistant Entity Node
  - Type: `sensor`
  - State: `msg.payload.matches[0].name`

_Any of the properties from the [MQTT](https://github.com/jakowenko/double-take#mqtt) message can be set as attributes on the node. Results for the camera topic are stored in an array and this sample only grabs the first result._

## Home Assistant Push Notification

- Home Assistant State Node
- Function Node
  ```javascript
  const {
    friendly_name,
    name,
    id,
    camera,
    confidence,
    type,
    detector,
    totalduration,
    attempts,
    filename,
  } = msg.data.new_state.attributes;
  msg.data.url = `http://localhost:3000/api/storage/matches/${filename}?box=true`;
  msg.message = `${friendly_name} is near the ${msg.payload} @ ${confidence}% by ${detector}:${type} taking ${attempts} attempt(s) @ ${totalduration} sec`;
  return msg;
  ```
- Home Assistant: Call Service Node
  ```json
  {
    "message": "{{message}}",
    "data": { "attachment": { "url": "{{{data.url}}}" } }
  }
  ```
