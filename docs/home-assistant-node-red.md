# [Home Assistant](https://www.home-assistant.io) + [Node-Red](https://nodered.org)

Create dynamic Home-Assistant entities when matches are detected and send a notification with a picture of the match.

## By Name

- MQTT in Node

  - Topic: `double-take/matches/:name`
  - QoS: `0`
  - Output: `a parsed JSON object`

- Home Assistant Entity Node
  - Type: `Sensor`
  - State: `msg.payload.camera`

_Any of the properties from the [MQTT](https://github.com/jakowenko/double-take#mqtt) message can be set as attributes on the node._

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116504950-96dc3f80-a887-11eb-8674-86976888e1fb.png">
</p>

<p align="center">
  <img align="top" src="https://user-images.githubusercontent.com/1081811/116504763-161d4380-a887-11eb-88db-394aea9c7113.png" width="49%">
  <img src="https://user-images.githubusercontent.com/1081811/116504789-2a614080-a887-11eb-93a7-614a365c310d.png" width="49%">
</p>


## By Camera

- MQTT in Node

  - Topic: `double-take/camera/:camera`
  - QoS: `0`
  - Output: `a parsed JSON object`

- Home Assistant Entity Node
  - Type: `Sensor`
  - State: `msg.payload.matches[0].name`

_Any of the properties from the [MQTT](https://github.com/jakowenko/double-take#mqtt) message can be set as attributes on the node. Results for the camera topic are stored in an array and this sample only grabs the first result._

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505063-f0446e80-a887-11eb-944d-1160ff3db19e.png">
</p>

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505109-1833d200-a888-11eb-92bd-218d68e371d2.png" align="top" width="49%">
  <img src="https://user-images.githubusercontent.com/1081811/116505092-081bf280-a888-11eb-9a5e-8e849d7234f2.png" align="top" width="49%">
</p>


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

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505223-59c47d00-a888-11eb-8810-31a3a8f62517.png">
</p>

<p align="center">
  <img src="https://user-images.githubusercontent.com/1081811/116505336-998b6480-a888-11eb-9e9a-2a55f5a48369.png"align="top" width="33%">
  <img src="https://user-images.githubusercontent.com/1081811/116505238-62b54e80-a888-11eb-81ae-5025f4616249.png" align="top" width="33%">
  <img src="https://user-images.githubusercontent.com/1081811/116505241-6517a880-a888-11eb-9b54-b80488133001.png" align="top" width="33%">
</p>


