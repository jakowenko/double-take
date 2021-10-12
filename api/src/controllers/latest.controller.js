const fs = require('fs');
const axios = require('axios');
const database = require('../util/db.util');
const { jwt } = require('../util/auth.util');
const { BAD_REQUEST } = require('../constants/http-status');
const { AUTH, SERVER, STORAGE } = require('../constants')();

module.exports.image = async (req, res) => {
  const { filename } = req.params;
  const { box } = req.query;
  const name = filename.replace('.jpg', '');
  const source = `${STORAGE.PATH}/latest/${filename}`;

  if (!fs.existsSync(source)) return res.status(BAD_REQUEST).error(`${source} does not exist`);

  const db = database.connect();
  const [nameMatch] = db
    .prepare(
      `SELECT t.id, filename, value FROM (
          SELECT match.id, filename, json_extract(value, '$.results') results
          FROM match, json_each( match.response)
          ) t, json_each(t.results)
        WHERE json_extract(value, '$.name') IN (${database.params([name])})
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT 1`
    )
    .all(name);

  const [cameraMatch] = db
    .prepare(
      `SELECT t.id, t.event, filename, value FROM (
          SELECT match.id, event, filename, json_extract(value, '$.results') results
          FROM match, json_each( match.response)
          ) t, json_each(t.results)
        WHERE json_extract(t.event, '$.camera') IN (${database.params([name])})
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT 1`
    )
    .all(name);

  if ((!nameMatch && !cameraMatch) || box !== 'true') {
    res.set('Content-Type', 'image/jpeg');
    return res.end(fs.readFileSync(source));
  }

  const { filename: originalFilename } = nameMatch || cameraMatch;

  const request = await axios({
    method: 'get',
    url: `http://0.0.0.0:${SERVER.PORT}/api/storage/matches/${originalFilename}?box=true`,
    headers: AUTH ? { authorization: jwt.sign({ route: 'storage' }) } : null,
    responseType: 'arraybuffer',
  });

  res.set('Content-Type', 'image/jpeg');
  res.end(request.data);
};
