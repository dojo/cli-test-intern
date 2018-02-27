module.exports = function (grunt) {
	var staticFiles = [ 'intern/**/*.json' ];
	require('grunt-dojo2').initConfig(grunt, {
		ts: {
			dist: {
				exclude: [
					'./src/intern/*.json',
					'./tests/**/*.ts'
				]
			}
		},
		copy: {
			staticDistFiles: {
				expand: true,
				cwd: 'src',
				src: staticFiles,
				dest: '<%= distDirectory %>'
			},
			staticDevFiles: {
				expand: true,
				cwd: 'src',
				src: staticFiles,
				dest: '<%= devDirectory %>/src'
			},
			staticTestFiles: {
				expand: true,
				cwd: 'tests',
				src: [ 'support/assets/*.test' ],
				dest: '<%= devDirectory %>/tests'
			}
		},
		intern: {
			version: 4
		}
	});

	grunt.registerTask('dist', grunt.config.get('distTasks').concat(['copy:staticDistFiles']));
	grunt.registerTask('dev', grunt.config.get('devTasks').concat(['copy:staticDevFiles']));
};
