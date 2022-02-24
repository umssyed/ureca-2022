var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('cssfix', function() {
  gulp.src('public/stylsheets/404.css')
    .pipe(autoprefixer())
    .pipe(gulp.dest('build'));
});
