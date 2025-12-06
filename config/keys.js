// Central place to expose secret keys from environment.
// Keeps config consumers consistent and avoids hard-coded strings.
module.exports = {
  JWT_KEY: process.env.JWT_KEY,
  EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET,
};