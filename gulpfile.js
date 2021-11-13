const project_folder = 'build';
const source_folder = 'src';

const path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/scss/style.scss',
    js: source_folder + '/js/script.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: source_folder + '/fonts/*.ttf',
  },
  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/scss/**/*.scss',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
  },
  clean: './' + project_folder + '/',
};

const { src, dest } = require('gulp'),
  gulp = require('gulp'),
  browsersync = require('browser-sync').create(),
  fileinclude = require('gulp-file-include'),
  del = require('del'),
  scss = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  group_media = require('gulp-group-css-media-queries'),
  clean_css = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify-es').default,
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  webphtml = require('gulp-webp-html'),
  webpcss = require('gulp-webpcss'),
  svgSprite = require('gulp-svg-sprite'),
  // babel = require('gulp-babel'),
  deploy = require('gulp-gh-pages'),
  eslint = require('gulp-eslint'),
  webpack = require('webpack'),
  webpackStream = require('webpack-stream');

function browserSync(params) {
  browsersync.init({
    server: { baseDir: './' + project_folder + '/' },
    port: 3000,
    notify: false,
  });
}
function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}
function css() {
  return src(path.src.css)
    .pipe(scss({ outputStyle: 'expanded' }))
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true,
      }),
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}
function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(
      webpackStream({
        mode: 'development',
        output: {
          filename: 'script.js',
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                },
              },
            },
          ],
        },
      }),
    )
    .on('error', function (err) {
      console.error('WEBPACK ERROR', err);
      this.emit('end'); // Don't stop the rest of the task
    })
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(webp({ quality: 80 }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        interlaced: true,
        progressive: true,
        optimizationLevel: 3,
        svgoPlugins: [
          {
            removeViewBox: false,
          },
        ],
      }),
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}
gulp.task('deploy', () => src('./build/**/*').pipe(deploy()));
gulp.task('svgSprite', function () {
  return gulp
    .src([source_folder + '/iconsprite/*.svg'])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../icons/icons.svg',
            // example: true,
          },
        },
      }),
    )
    .pipe(dest(path.build.img));
});

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean(params) {
  return del(path.clean);
}
const build = gulp.series(clean, gulp.parallel(js, css, html, images));
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
