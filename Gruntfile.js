module.exports = function(grunt) {
  grunt.initConfig({
    'download-atom-shell': {
      version: '0.21.2',
      outputDir: 'build'
    }
  });

  grunt.loadNpmTasks('grunt-download-atom-shell');
};