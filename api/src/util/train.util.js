const perf = require('execution-time')();
const database = require('./db.util');
const filesystem = require('./fs.util');
const { train, remove } = require('./detectors/actions');

const { detectors } = require('../constants/config');

module.exports.queue = async (files) => {
  try {
    if (!files.length) return [];

    perf.start();
    console.log(`queuing ${files.length} file(s) for training`);

    const inserts = [];
    files.forEach((file, i) => {
      for (const detector of detectors()) {
        inserts.push({
          ...file,
          number: i + 1,
          detector,
        });
      }
    });

    database.insert('train', inserts);

    const outputs = [];
    for (let i = 0; i < inserts.length; i++) {
      const { name, filename, key, detector, number } = inserts[i];
      console.log(`file ${number} - ${detector}: ${name} - ${filename}`);
      const result = await this.process({ name, key, detector });
      outputs.push({ ...result, key });
      inserts[i].meta = JSON.stringify(result);
      database.insert('train', [inserts[i]]);
    }

    database.insert('train', inserts);
    console.log(`training complete in ${parseFloat((perf.stop().time / 1000).toFixed(2))} sec`);
    return outputs;
  } catch (error) {
    console.error(`queue error: ${error.message}`);
  }
};

module.exports.process = async ({ name, key, detector }) => {
  try {
    const { status, data } = await train({ name, key, detector });
    return {
      ...data,
      status,
      detector,
    };
  } catch (error) {
    const { status, data } = error.response;
    const message = typeof data === 'string' ? { data } : { ...data };

    if (data.message) {
      console.error(`${detector} training error: ${data.message}`);
    } else if (data.error) {
      console.error(`${detector} training error: ${data.error}`);
    } else {
      console.error(`${detector} training error: ${error.message}`);
    }

    return {
      ...message,
      status,
      detector,
    };
  }
};

module.exports.add = async (name, opts = {}) => {
  const files = await filesystem.files().train();
  database.insert('init', files);
  let images = opts.images || database.files('untrained', name);
  if (opts.files) {
    images = images.filter((obj) => opts.files.includes(obj.filename));
  }
  await this.queue(images);
};

module.exports.remove = async (name) => {
  const promises = [];
  for (const detector of detectors()) {
    promises.push(remove({ detector, name }));
  }
  const results = (await Promise.all(promises)).map((result, i) => ({
    detector: detectors()[i],
    results: result.data,
  }));

  const db = database.connect();
  db.prepare(
    `DELETE FROM train WHERE detector IN (${detectors()
      .map((value) => `'${value}'`)
      .join(',')}) AND name = ?`
  ).run(name);

  return results;
};

module.exports.retrain = async (name, opts = {}) => {
  const { ids } = opts;
  if (ids.length) {
    const db = database.connect();
    db.prepare(
      `DELETE FROM train WHERE name = ? AND fileID IN (${ids.map((id) => `'${id}'`).join(',')})`
    ).run(name);
  }
  const images = ids.length ? database.files('trained-ids', name) : null;
  await this.remove(name);
  await this.add(name, { images });
};

module.exports.status = () => {
  const db = database.connect();
  const status = db
    .prepare(
      `SELECT train.name, IFNULL(t1.count, 0) trained,  COUNT(*) total
        FROM train
        LEFT JOIN (
        SELECT name, COUNT(*) count
        FROM train
        WHERE meta IS NOT NULL
        GROUP BY name
        ) t1 ON train.name = t1.name
        GROUP BY train.name
        ORDER BY train.name`
    )
    .all();
  return status.map((obj) => ({
    ...obj,
    percent: parseFloat(((obj.trained / obj.total) * 100).toFixed(0)),
  }));
};
