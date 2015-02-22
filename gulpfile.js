var gulp = require('gulp');
var browserify = require('gulp-browserify');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var rimraf = require('gulp-rimraf');

var version = require('./package.json').version;

function compile() {
  return gulp.src('lib/*.es6')
    .pipe(babel({
      experimental: true
    }))
    .pipe(rename({
      extname: '.js'
    }));
}

gulp.task('es6-test', function() {
  return compile()
    .pipe(gulp.dest('lib'));
});

gulp.task('test', ['es6-test'], function() {
  return gulp.src('test/enumTest.js')
    .pipe(mocha())
    .on('end', function () {
      return gulp.src('lib/*.js')
        .pipe(rimraf());
    });
});

gulp.task('es6-build', function() {
  return compile()
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['es6-build'], function() {
  return gulp.src('index.js')
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
