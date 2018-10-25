const babelify    = require('babelify');
const browserify  = require('browserify');
const buffer      = require('vinyl-buffer');
const concat      = require('gulp-concat');
const del         = require('del');
const gulp        = require('gulp');
const imagemin    = require('gulp-imagemin');
const gulpif      = require('gulp-if');
const minifyCSS   = require('gulp-csso');
const sass        = require('gulp-sass');
const source      = require('vinyl-source-stream');
const sourcemaps  = require('gulp-sourcemaps');
const sync        = require('browser-sync').create();
const uglify      = require('gulp-uglify');
const autoprefixer= require('gulp-autoprefixer');
const pxtorem     = require('gulp-pxtorem');
const cleaner     = require('gulp-clean');
const plumber     = require('gulp-plumber');
const notify     	= require('gulp-notify');
const gutil     	= require('gulp-util');

const isProd = process.env.NODE_ENV === 'production';

const paths = {
    css: {
      src: [
        './node_modules/slick-carousel/slick/slick-theme.css',
        './node_modules/slick-carousel/slick/slick.css',
        './app/scss/style.scss'
      ],
      out: 'style.min.css',
      dist: './dist/css'
    },
    js: {
      src: [
        './app/js/app.js'
      ],
      out: 'app.min.js',
      dist: 'dist/js'
    },
    img: {
      src: './app/img/**/*',
      dist: './dist/img'
    },
    fonts: {
      src: './app/fonts/**/*',
      dist: './dist/fonts'
    },
    html: {
      src: './app/**/*.html',
      dist: './dist/'
    },
    dist: [
      'dist'
    ],
    server: {
      baseDir: './dist'
    },
    watch: {
      css: 'app/**/*.scss',
      js: 'app/js/*.js',
      html: 'app/**/*.html',
      img: 'app/img/*'
    }
};

/**
 * SCSS
 */

function scss() {
  return gulp.src(paths.css.src)
		.pipe(plumber({ errorHandler: function(err) {
			notify.onError({
				title: "Gulp error in " + err.plugin,
				message:  err.toString()
			})(err);

			gutil.beep();
		}}))
    .pipe(concat(paths.css.out))
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass())
    .pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false }))
    .pipe(pxtorem())
    .pipe(minifyCSS())
    .pipe(gulp.dest(paths.css.dist))
    .pipe(sync.stream());
}

/**
 * JS Task w/ Browserify
 */

function js(done) {
	return browserify({entries: paths.js.src, debug: true})
		.transform(babelify, {presets: 'es2015'})
		.bundle()
		.on('error', function(err) {
			notify.onError({
				title: "Gulp error in " + err.filename,
				message:  err.message
			})(err);

			gutil.beep();
			done();
		})
		.pipe(source(paths.js.out))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest(paths.js.dist))
		.pipe(sync.stream());
};

/**
 * IMAGES
 */

function images() {
  return gulp.src(paths.img.src)
    .pipe(gulpif(isProd, imagemin({verbose: true})))
    .pipe(gulp.dest(paths.img.dist));
}

/**
 * FONTS
 */

function fonts() {
  return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dist));
}

/**
* HTML
*/
function html() {
  return gulp.src(paths.html.src)
  .pipe(gulp.dest(paths.html.dist));
}

/**
 * GLOBAL
 */

function clean() {
  return del(paths.dist);
}



gulp.task('build', gulp.series(clean, gulp.parallel(html, scss, js, images, fonts)));

gulp.task('default', gulp.parallel(html, scss, js, images, fonts, function(done) {
  sync.init({
    server: paths.server
  });

  gulp.watch(paths.watch.css, scss);
  gulp.watch(paths.watch.js, js);
  gulp.watch(paths.watch.html, html);
  gulp.watch(paths.watch.img, images);

  done();
}));
