module.exports = {
  enabled: process.env.NGROK_ENABLED === 'true' || false,
  authtoken: process.env.NGROK_AUTHTOKEN || '',
  region: process.env.NGROK_REGION || 'us',
  port: process.env.PORT || 8080
};