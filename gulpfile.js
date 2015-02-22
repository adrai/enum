var gulp = require('gulp');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var version = require('./package.json').version;
 
gulp.task('build', function() {
  gulp.src('lib/enum.js')
    .pipe(browserify({
      standalone: 'Enum',
      insertGlobals : true,
      debug : !gulp.env.production
    }))
    .pipe(rename('enum-' + version + '.js'))
    .pipe(gulp.dest('./'))
    .on('finish', function () {
      gulp.src('./enum-' + version + '.js')
        .pipe(uglify())
        .pipe(rename('enum-' + version + '.min.js'))
        .pipe(gulp.dest('./'));
    });
});


gulp.task('default', ['build']);
