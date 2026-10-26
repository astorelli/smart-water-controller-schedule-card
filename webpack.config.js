const path = require('path');

module.exports = {
  entry: './src/smart-water-controller-schedule-card.js',
  mode: 'production',
  output: {
    filename: 'smart-water-controller-schedule-card.js',
    // dist/, not the repository root: the root file is the four-card HACS bundle
    // that scripts/build.js writes, and webpack only knows the schedule card.
    path: path.resolve(__dirname, 'dist')
  }
};