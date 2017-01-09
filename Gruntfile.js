module.exports = function (grunt) {
	var staticFiles = [ 'intern/**' ];
	require('grunt-dojo2').initConfig(grunt, {
	    ts: {
	    	dist: {
	    		exclude: [
	    			'./src/intern',
                    "./tests/**/*.ts"
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
            }
		}
	});

	grunt.registerTask('ci', [
		'intern:node'
	]);

	grunt.registerTask('dist', grunt.config.get('distTasks').concat(['copy:staticDistFiles']));
	grunt.registerTask('dev', grunt.config.get('devTasks').concat(['copy:staticDevFiles']));
};
