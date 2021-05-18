# [Home Assistant](https://www.home-assistant.io) + [Node-Red](https://nodered.org)

## Home Assistant Push Notification

- Home Assistant State Node
- Function Node
  ```javascript
  const {
    name,
    id,
    camera,
    confidence,
    type,
    detector,
    totalDuration,
    attempts,
    filename,
  } = msg.data.new_state.attributes;
  msg.data.url = `http://localhost:3000/api/storage/matches/${filename}?box=true`;
  msg.message = `${name} is near the ${msg.payload} @ ${confidence}% by ${detector}:${type} taking ${attempts} attempt(s) @ ${totalDuration} sec`;
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
  <img src="https://user-images.githubusercontent.com/1081811/116505336-998b6480-a888-11eb-9e9a-2a55f5a48369.png"align="top" width="32%">
  <img src="https://user-images.githubusercontent.com/1081811/116505238-62b54e80-a888-11eb-81ae-5025f4616249.png" align="top" width="32%">
  <img src="https://user-images.githubusercontent.com/1081811/116505241-6517a880-a888-11eb-9b54-b80488133001.png" align="top" width="32%">
</p>
