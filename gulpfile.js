"use strict";

var runSequence  = require('run-sequence');
var pjson        = require("./package.json");
var gulp         = require("gulp");
var fs           = require("fs");
var gutil        = require("gulp-util");
var watch        = require("gulp-watch"); // не нужно
var sass         = require("gulp-sass");
var browserSync  = require("browser-sync");
var concat       = require("gulp-concat");
var browserify   = require("gulp-browserify");
var uglify       = require("gulp-uglify");
var csso         = require("gulp-csso");
var rename       = require("gulp-rename");
var del          = require("del");
var imagemin     = require("gulp-imagemin");
var pngquant     = require("imagemin-pngquant");
var cache        = require("gulp-cache");
var autoprefixer = require("gulp-autoprefixer");
var rigger       = require("gulp-rigger");
var pagebuilder  = require('gulp-pagebuilder');
var base64       = require("gulp-base64");
var zip          = require("gulp-zip");
var size         = require("gulp-size");
var realFavicon  = require("gulp-real-favicon");



//var $    = require("gulp-load-plugins")();
//var reload = browserSync.reload;

// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

var name = {
    css: "stylesheets.css",
    js: "javascripts.js",
    min: ".min"
};

var path = {
    html: {
        source: ["./app/templates/*.{html,htm}"],
        destination: "./app/",
        baseDir: ["./app/*.{html,htm}"],
        watch: [
            "./app/templates/**/**/*.{html,htm}",
            "./app/templates/**/*.{html,htm}",
            "./app/templates/parts/**/*.{html,htm}"
        ],
        build: "./dist/",
        templates: "./app/templates/"
    },
    css: {
        source: ["./app/sass/app.{scss,sass}"],
        destination: "./app/css/",
        baseDir: ["./app/css/**/*"],
        watch: [
            "./app/sass/**/*.{css,scss,sass}",
            "./app/sass/fonts/**/*.{css,scss,sass}"
        ],
        build: "./dist/css/"
    },
    js: {
        source: ["./app/scripts/main.js"],
        destination: "./app/js/",
        baseDir: ["./app/js/**/*"],
        watch: ["./app/scripts/**/*.js"],
        build: "./dist/js/"
    },
    img: {
        source: ["./app/img/**/*.*"],
        destination: "none",
        baseDir: ["./app/img/**/*.*"],
        watch: ["./app/img/**/*.{png,jpg,gif,svg}"],
        build: "./dist/img/"
    },
    fonts: {
        source: [
            "./app/sass/fonts/foundation-icon-fonts/**/*.{ttf,woff,woff2,eoff,svg}",
            "./app/sass/fonts/nucleo-glyph/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/nucleo-outline/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/glyphicons/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/glyphicons-halflings/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/fontawesome/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/zocial/**/*.{ttf,woff,woff,woff2,eoff,svg}"
        ],
        destination: "./app/fonts/",
        baseDir: ["./app/fonts/**/*.{ttf,woff,,woff2,eoff,svg}"],
        watch: [
            "./app/sass/fonts/foundation-icon-fonts/**/*.{tff,woff,woff2,eof,svg}",
            "./app/sass/fonts/nucleo-glyph/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/nucleo-outline/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/glyphicons/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/glyphicons-halflings/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/fontawesome/**/*.{ttf,woff,woff,woff2,eoff,svg}",
            "./app/sass/fonts/zocial/**/*.{ttf,woff,woff,woff2,eoff,svg}"
        ],
        build: "./dist/fonts/"
    },
    zip: {
        source: ["./dist/**/*"],
        build: "./zip/"
    },
    // 19, 21
    favicon: {
        master: "./app/master/favicon.svg", // TODO: Path to your master picture
        destination: "./app/favicon/", // TODO: Path to the directory where to store the icons
        sourceHTML: ["./app/master/favicon.html"], // TODO: List of the HTML files where to inject favicon markups
        destinationHTML: "./app/templates/parts/meta/", // TODO: Path to the directory where to store the HTML files
        hrefHTML: "/favicon/",
        baseDir: ["./app/favicon/**/*.*"],
        watch: ["./app/favicon/**/*.*"],
        build: "./dist/favicon/"
    },
    clean: {
        dist: "./dist/",
        html: "./app/*.{html,htm}",
        js: "./app/js/",
        css: "./app/css/",
        fonts: "./app/fonts/",
        favicon: ["./app/favicon/"] // , "./app/templates/parts/meta/favicon.html"
    }
};

var configWebServer = {
    main: {
        open: true,
        server: {
            directory: false,
            baseDir: "./app",
            index: "index.html"
        },
        ghostMode: {
            links: true,
            forms: true,
            scroll: true
        },
        files: [
            "*.html",
            "img/*.html",
            "css/*.css",
            "img/**/*.{png,jpg,gif,svg}",
            "js/*.js",
            "fonts/*.{eot,woff,woff2,ttf}",
            {
                options: {
                    //ignored: "*.txt"
                }
            }
        ],
        notify: true,
        tunnel: "relty",
        host: "localhost",
        //devBaseUrl: "http://localhost",
        port: 4000,
        ui: {
            port: 4001
        },
        online: true,
        debugInfo: true,
        logPrefix: pjson.name + ".v" + pjson.version,
        //logLevel: "silent",
        logConnections: true,
        logFileChanges: true
    },
    callback: function() {
        gulp.start("watch");
    }
};


// Функция обработки ошибок
var handleError = function(err) {
    gutil.log([(err.name + " in " + err.plugin).bold.red, "", err.message, ""].join("\n"));

    if (gutil.env.beep) {
        gutil.beep();
    }

    this.emit("end");
};

var correctNumber = function correctNumber(number) {
    return number < 10 ? "0" + number : number;
};

var getDateTime = function getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = correctNumber(now.getMonth() + 1);
    var day = correctNumber(now.getDate());
    var hours = correctNumber(now.getHours());
    var minutes = correctNumber(now.getMinutes());
    return year + "-" + month + "-" + day + "-" + hours + minutes;
};

gulp.task("sass", function() {
    del.sync(path.clean.css);
    return gulp.src(path.css.source)
        .pipe(concat(name.css))
        .pipe(sass({
            sourceMap: true,
            errLogToConsole: true,
            outputStyle: "compressed"
        }).on("error", handleError))
        .pipe(base64({
            extensions: ["jpg", "png"],
            maxImageSize: 32*1024 // max size in bytes, 32kb limit is strongly recommended due to IE limitations
        }))
        .pipe(csso())
        .pipe(autoprefixer({
            browsers: ["iOS >= 6", "android 4", "opera 12.1", "Chrome >= 30", "ie >= 9", "Firefox >= 20", "last 2 versions"],
            cascade: true
        }))
        .pipe(rename({
            prefix: "",
            suffix: name.min,
            extname: ".css"
        }))
        .on("error", handleError)
        .pipe(gulp.dest(path.css.destination))
        .pipe(size({
            title: "size of styles"
        }))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task("copyfonts", function () {
    del.sync(path.clean.fonts);
    return gulp.src(path.fonts.source)
        .on("error", handleError)
        .pipe(gulp.dest(path.fonts.destination))
        .pipe(browserSync.reload({stream: true}));
});

//["html", "scripts", "sass", "copyfonts"]
gulp.task("web-server", function() {
    browserSync(configWebServer.main, configWebServer.callback);
});

gulp.task("scripts", function() {
    del.sync(path.clean.js);
    return gulp.src(path.js.source)
        .pipe(rigger())
        .pipe(concat(name.js))
        .pipe(browserify())
        .pipe(uglify())
        .pipe(rename({
            prefix: "",
            suffix: name.min,
            extname: ".js"
        }))
        .on("error", handleError)
        .pipe(gulp.dest(path.js.destination))
        .pipe(size({
            title: "size of js"
        }))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task("html", function() {
    del.sync(path.clean.html);
    return gulp.src(path.html.source)
        .pipe(pagebuilder(path.html.templates))
        .on("error", handleError)
        .pipe(gulp.dest(path.html.destination))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task("watch", function() {
    gulp.watch(path.js.watch, ["scripts"]);
    gulp.watch(path.css.watch, ["sass"]);
    gulp.watch(path.fonts.watch, ["copyfonts"]);
    gulp.watch(path.html.watch, ["html"]);
    gulp.watch(path.img.watch, [browserSync.reload]);
    gulp.watch(path.favicon.watch, [browserSync.reload]);
});

gulp.task("clean", function() {
    return del.sync(path.clean.dist);
});

gulp.task("img", function() {
    return gulp.src(path.img.baseDir)
        .pipe(cache(imagemin({
            optimizationLevel: 5,
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .on("error", handleError)
        .pipe(gulp.dest(path.img.build))
        .pipe(size({
            title: "size of images"
        }));
});


// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('generate-favicon', function(done) {
    realFavicon.generateFavicon({
        masterPicture: path.favicon.master, // TODO: Path to your master picture
        dest: path.favicon.destination, // TODO: Path to the directory where to store the icons
        iconsPath: path.favicon.hrefHTML,
        design: {
            desktopBrowser: {},
            ios: {
                pictureAspect: 'backgroundAndMargin',
                backgroundColor: '#ffffff',
                //pictureAspect: 'noChange',
                margin: '18%',
                assets: {
                    ios6AndPriorIcons: true,
                    ios7AndLaterIcons: true,
                    precomposedIcons: true,
                    declareOnlyDefaultIcon: true
                },
                appName: pjson.name
            },
            windows: {
                pictureAspect: 'whiteSilhouette',
                backgroundColor: '#b91d47',
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: true,
                    windows10Ie11EdgeTiles: {
                        small: true,
                        medium: true,
                        big: true,
                        rectangle: true
                    }
                },
                appName: pjson.name
            },
            firefoxApp: {
                pictureAspect: "no_change",
                roundedSquare: {
                    margin: '5%',
                    backgroundColor: '#ffffff',
                },
                manifest: {
                    appName: pjson.name
                }
            },
            androidChrome: {
                pictureAspect: 'shadow',
                //themeColor: '#ffffff',
                manifest: {
                    name: pjson.name,
                    display: 'browser',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: true,
                    lowResolutionIcons: true
                }
            },
            safariPinnedTab: {
                //pictureAspect: 'silhouette',
                //pictureAspect: 'blackAndWhite',
                //threshold: 59.1875,
                //themeColor: '#86dbff'
                //themeColor: '#228bf2'
                pictureAspect: 'blackAndWhite',
                threshold: 55.9375,
                themeColor: '#b91d47'
            },
            openGraph: {
                pictureAspect: "no_change",
                siteUrl: "url"
            },
            yandexBrowser: {
                backgroundColor: "#ffffff",
                manifest: {
                    showTitle: true
                }
            }
        },
        settings: {
            //compression: 5,
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false

        },
        versioning: {
            paramName: 'v',
            paramValue: pjson.version
        },
        markupFile: FAVICON_DATA_FILE
    }, function() {
        done();
    });
});

// Inject the favicon markups in your HTML pages. You should run
// this task whenever you modify a page. You can keep this task
// as is or refactor your existing HTML pipeline.
gulp.task('inject-favicon-markups', function() {
    return console.log("Отключен: " + 'inject-favicon-markups');
    gulp.src(path.favicon.sourceHTML) // TODO: List of the HTML files where to inject favicon markups
        .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code, {
            keep: [
                'link[rel="mask-icon"]',
                'link[rel="shortcut icon"]',
                'link[rel="icon"]',
                'link[rel^="apple-touch-icon"]',
                'link[rel="manifest"]',
                'link[rel="yandex-tableau-widget"]',
                'meta[name^="msapplication"]',
                'meta[name="mobile-web-app-capable"]',
                'meta[name="theme-color"]',
                'meta[property="og:image"]'
            ]
        }))
        .pipe(gulp.dest(path.favicon.destinationHTML)); // TODO: Path to the directory where to store the HTML files
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    realFavicon.checkForUpdates(currentVersion, function(err) {
        if (err) {
            throw err;
        }
    });
});

gulp.task('clean-favicon', function() {
    del.sync(path.clean.favicon);
});

gulp.task('favicon', function(done){
    return runSequence("clean-favicon", "generate-favicon", "inject-favicon-markups", function(){
        done();
    });
});

gulp.task("build", function(done) {

    del.sync(path.clean.dist);
    return runSequence("clean", ["img", "sass", "copyfonts", "scripts"], "html", function() {

        gulp.src(path.html.baseDir)
            .pipe(gulp.dest(path.html.build));

        gulp.src(path.js.baseDir)
            .pipe(gulp.dest(path.js.build));

        gulp.src(path.css.baseDir)
            .pipe(gulp.dest(path.css.build));

        gulp.src(path.fonts.baseDir)
            .pipe(gulp.dest(path.fonts.build));

        gulp.src(path.favicon.baseDir)
            .pipe(gulp.dest(path.favicon.build));

        done();
    });
});

gulp.task("build-zip", ["build"], function() {
    var datetime = getDateTime();
    var zipName = "dist-" + pjson.name + ".v" + pjson.version + "-" + datetime + ".zip";

    console.log("Create build-zip: " + path.zip.build + zipName);

    return gulp.src(path.zip.source)
        .pipe(zip(zipName))
        .on("error", handleError)
        .pipe(gulp.dest(path.zip.build))
        .pipe(size({
            title: "size of build.zip"
        }));
});

gulp.task("clear", function (callback) {
    return cache.clearAll();
});

gulp.task("default", ["web-server"]);