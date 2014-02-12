'use strict';

module.exports = function(grunt){

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

   grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),


		ngmin:{
			controllers:{
				src: ['public/js/*.js'],
				dest: 'public/build/concat.js'
			}
		},
		uglify: {
		    build: {
		        src: 'public/build/concat.js',
		        dest: 'public/build/production.min.js'
		    }
		},
		cssmin: {
  			minify: {
			    expand: true,
			    cwd: 'public/css/',
			    src: ['*.css', '!*.min.css'],
			    dest: 'public/css/',
			    ext: '.min.css'
			  }
		},
		watch: {
			scripts:{
				files: ['public/js/*.js','public/css/app.css'],
				tasks: ['ngmin','uglify','cssmin'],
				options:{
					spawn:false
				}
			}
		}		
    });



	grunt.registerTask('default', ['ngmin','uglify','cssmin']);
}