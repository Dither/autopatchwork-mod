module.exports = function(grunt) {
// Project configuration.
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
        options: {
            curly: false, // true: force { }
            eqnull: true, // true: enable something == null
            eqeqeq: true, // true: force ===
            immed: true, // true: immidiatly invocated fns has to be in ()
            newcap: true, // true: construcotr has to have firt letter uppercased
            noarg: true, // true: no arguments.caller and arguments.callee
            sub: true, // true: no warning about a['something'] if a.something can be used
            undef: true, // true: can't use undeclared vars
            browser: true, // true: set window object and other stuff as globals
            devel: true, // true: set alert,confirm,console,... as globals
            boss: true, // true: allow assigments in conditions and return statements
            forin: true, // true: hasOwnProperty has to be in all for..in cycles
            noempty: true, // true: no empty blocks
            unused: true, // true: warn about unused vars
            trailing: true, // true: no trailing whitespaces
            supernew: true, // true: enable 'new Constructor' instead of 'new Constructor()'
            onevar: false, // true: only one var per fn
            funcscope: false, // false: no 'var' in blocks
            maxdepth: 5, // max nesting depth
            quotmark: 'single', // single: force '
            '-W041': true, // don't warn about something == false/true
            '-W117': true, // don't warn about not defined vars until I refactorize bg.js
            globals: {
                app: true,
                bg: true,
                tabID: true,
                chrome: false,
                define: false,
                require: false,
                opera: false,

                /* browser globals not recognized by browser or devel options */
                requestAnimationFrame: true,
                URL: true,
                HTMLCollection: true
            }
        },
        all: ['includes/*.js', 'scripts/*.js']
    },
    closurecompiler: {
        my_target: {
            files: {
                'includes/autopatchwork.min.js': 'includes/autopatchwork.js'
            },
            options: {
                language_in: 'ECMASCRIPT5',
                compilation_level: 'SIMPLE',
                banner: '// ==UserScript==\n// @include http*\n// @exclude *//localhost*\n// @exclude *//127.0.0.*\n// @exclude *//192.168.*\n// @exclude *.com/embed*\n// @run-at document-start\n// @grant none\n// ==/UserScript==\n\n%output%\n//# sourceMappingURL=autopatchwork.min.js.map'
            }
        }
    }
});

grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-google-closure-tools-compiler');

// Default task(s).
grunt.registerTask('default', ['jshint']);

};
