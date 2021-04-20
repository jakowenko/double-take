const fs = require('fs');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { STORAGE_PATH } = require('../constants');

module.exports.folders = () => {
  return {
    list: async (req, res) => {
      try {
        const folders = await filesystem.folders().train();
        respond(HTTPSuccess(OK, folders), res);
      } catch (error) {
        respond(error, res);
      }
    },
    create: (req, res) => {
      try {
        const { name } = req.params;
        if (!fs.existsSync(`${STORAGE_PATH}/train/${name}`)) {
          fs.mkdirSync(`${STORAGE_PATH}/train/${name}`);
        }
        respond(HTTPSuccess(OK, { sucess: true }), res);
      } catch (error) {
        respond(error, res);
      }
    },
  };
};
