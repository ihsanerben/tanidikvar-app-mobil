const { withInfoPlist } = require('expo/config-plugins');

/** @type {import('expo/config-plugins').ConfigPlugin<{ development: boolean }>} */
module.exports = (config, { development }) => withInfoPlist(config, mod => {
  if (development) {
    mod.modResults.NSLocalNetworkUsageDescription = 'Geliştirme sunucusuna bağlanmak için yerel ağdaki bilgisayarına erişim gerekir.';
  } else {
    delete mod.modResults.NSLocalNetworkUsageDescription;
    delete mod.modResults.NSBonjourServices;
  }
  return mod;
});
