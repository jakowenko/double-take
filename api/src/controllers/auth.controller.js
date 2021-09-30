const { v4: uuidv4 } = require('uuid');
const { auth, jwt } = require('../util/auth.util');
const { BAD_REQUEST, UNAUTHORIZED } = require('../constants/http-status');

module.exports.tokens = {
  get: (req, res) => {
    const { tokens } = auth.get();
    res.send(tokens || []);
  },
  create: (req, res) => {
    const { name } = req.body;
    const tokens = auth.get().tokens || [];
    tokens.unshift({ name, token: uuidv4() });
    auth.set({ tokens });
    res.send();
  },
  delete: (req, res) => {
    const { token } = req.params;
    const currentTokens = auth.get().tokens || [];
    const tokens = currentTokens.filter((obj) => obj.token !== token);
    auth.set({ tokens });
    res.send(tokens);
  },
};

module.exports.login = (req, res) => {
  const { password } = req.body;
  const { password: current } = auth.get();
  if (password !== current) return res.status(UNAUTHORIZED).error();
  const token = jwt.sign();
  res.send({ token });
};

module.exports.password = (req, res) => {
  const { password } = req.body;
  auth.set({ password });
  const token = jwt.sign();
  res.send({ token });
};

module.exports.updatePassword = (req, res) => {
  const { password: currentPassword, newPassword } = req.body;
  const { password } = auth.get();

  if (currentPassword !== password) return res.status(BAD_REQUEST).error('Password Incorrect');

  auth.set({ secret: uuidv4(), password: newPassword });
  res.send();
};
