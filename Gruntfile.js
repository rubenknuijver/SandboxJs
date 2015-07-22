module.exports = function (grunt) {

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin',
        ngtemplates: 'grunt-angular-templates',
        cdnify: 'grunt-google-cdn'
    });

    grunt.loadNpmTasks('grunt-contrib-less');

    // Define the configuration for all the tasks
    grunt.initConfig({
        less: {
            development: {
                options: {
                    //paths: ["assets/css"]
                    compress: true,
                    yuicompress: true,
                    optimization: 2
                },
                files: {
                    "app/CommandGrid/css/grid.css": "app/CommandGrid/less/grid.less",
                    "app/CommandGrid/css/site.css": "app/CommandGrid/less/site.less"
                }
            }
        },
        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            styles: {
               files: ['less/**/*.less'], // which files to watch
               tasks: ['less'],
               options: {
                   nospawn: true
               }
            }
        },
        // Automatically inject Bower components into the app
        wiredep: {
            app: {
                src: ['app/CommandGrid/index.html'],
                ignorePath: /\.\.\//
            },
            //test: {
            //    devDependencies: true,
            //    src: '<%= karma.unit.configFile %>',
            //    ignorePath: /\.\.\//,
            //    fileTypes: {
            //        js: {
            //            block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
            //            detect: {
            //                js: /'(.*\.js)'/gi
            //            },
            //            replace: {
            //                js: '\'{{filePath}}\','
            //            }
            //        }
            //    }
            //},
        },
    });

    grunt.registerTask('build', [
        'less',
        'wiredep',
        //'concat',
    ]);
    //grunt.registerTask('default', ['less', 'watch']);
    grunt.registerTask('default', ['build']);
};
