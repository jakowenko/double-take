## Install

**Docker**
`docker pull jakowenko/frigate-events`

```shell
docker run -d \
  --name=frigate-events \
  -p 3000:3000 \
  -e FRIGATE_URL=http://YOUR-FRIGATE-URL.com \
  -e FACEBOX_URL=http://YOUR-FACEBOX-URL.com \
  jakowenko/frigate-events
```

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
