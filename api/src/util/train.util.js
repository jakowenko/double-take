const perf = require('execution-time')();
const database = require('./db.util');
const { train, remove } = require('./detectors/actions');
const { STORAGE } = require('../constants')();
const DETECTORS = require('../constants/config').detectors();

module.exports.queue = async (files, skip = []) => {
  try {
    if (!files.length) return [];

    const records = [];
    files.forEach(({ id, name, filename }, i) =>
      DETECTORS.forEach((detector) => {
        if (!skip.includes(detector)) {
          const record = {
            number: i + 1,
            id,
            name,
            filename,
            detector,
          };
          database.create.train(record);
          records.push(record);
        }
      })
    );

    const outputs = [];
    for (let i = 0; i < records.length; i++) {
      const { name, filename, detector } = records[i];
      const result = await this.process({
        name,
        key: `${STORAGE.MEDIA.PATH}/train/${name}/${filename}`,
        detector,
      }).catch((error) => ({ error: error.message }));
      outputs.push({ ...result });
      records[i].meta = JSON.stringify(result);
      database.create.train(records[i]);
    }
  } catch (error) {
    error.message = `queue error: ${error.message}`;
    console.error(error);
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
    if (!error.response) {
      return {
        message: error.message,
        status: 500,
        detector,
      };
    }
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
  perf.start();
  const { ids, files, skip } = opts;
  await database.resync.files();
  const queue = files
    ? files.map((obj) => database.get.fileByFilename(obj.name, obj.filename)).filter((obj) => obj)
    : ids
    ? database.get.filesById(ids)
    : database.get.untrained(name);

  console.log(`${name}: queuing ${queue.length} file(s) for training`);
  await this.queue(queue, skip);
  console.log(
    `${name}: training complete in ${parseFloat((perf.stop().time / 1000).toFixed(2))} sec`
  );
};

module.exports.remove = async (name, opts = {}) => {
  perf.start();

  const { ids } = opts;
  const db = database.connect();

  const promises = [];
  DETECTORS.forEach((detector) =>
    promises.push(remove({ detector, ids: Array.isArray(ids) ? ids : [], name }))
  );

  const results = (await Promise.all(promises)).map((result, i) => ({
    detector: DETECTORS[i],
    results: result?.data || result,
  }));

  if (ids && ids.length) {
    db.prepare(
      `DELETE FROM train WHERE name = ? AND detector IN (${database.params(
        DETECTORS
      )}) AND fileId IN (${database.params(ids)})`
    ).run(name, DETECTORS, ids);
    const addIds = database.get
      .trained(name)
      .filter((obj) => DETECTORS.includes(obj.detector))
      .map((obj) => obj.fileId);

    if (addIds.length) await this.add(name, { ids: addIds, skip: ['rekognition'] });
    return { success: true };
  }

  db.prepare(
    `DELETE FROM train WHERE name = ? AND detector IN (${database.params(DETECTORS)})`
  ).run(name, DETECTORS);

  console.log(
    `${name}: untraining complete in ${parseFloat((perf.stop().time / 1000).toFixed(2))} sec`
  );

  return results;
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
