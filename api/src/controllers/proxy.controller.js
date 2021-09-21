const axios = require('axios');

module.exports.url = async (req, res) => {
  const { url } = req.query;
  const { data } = await axios({
    method: 'get',
    url,
  });
  res.send(data);
};
