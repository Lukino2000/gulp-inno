var es = require('event-stream');
var spawn = require('child_process').spawn;
var path = require('path');
var gutil = require('gulp-util');

module.exports = function (opts) {
  opts = opts || {};
  opts.args = opts.args || [];
  opts.env = Object.assign({}, process.env, opts.env || {});

  var logError = function (msg) { gutil.log(gutil.colors.red(msg)) }
  var logWarning = function (msg) { gutil.log(gutil.colors.yellow(msg)) }
  var logInfo = function (msg) { gutil.log(gutil.colors.white(msg)) }
  var log = function (msg) { gutil.log(msg) }
  var empty = function(){};

  if (!('stdout' in opts) || !opts.stdout) log = empty;
  if (!('stderr' in opts) || !opts.stderr) logError = empty;

  return es.map(function (script, next) {
    var compil = path.resolve(path.join(__dirname, 'inno/ISCC.exe'));
    var script_path = path.resolve(script.path);

    var args, run;
    if (process.platform !== 'win32') {
      args = [compil, 'Z:' + script_path].concat(opts.args);
      run = spawn('wine', args, { env: opts.env });
    } else {
      args = [script_path].concat(opts.args);
      run = spawn(compil, args, { env: opts.env });
    }
    run.stdout.on('data', function (data) {
      log('stdout: ' + data.toString().trim());
    });
    run.stderr.on('data', function (data) {
      logError('stderr: ' + data.toString().trim());
    });
    run.on('close', function (code) {
      if (code !== 0) {
        var message = 'child process exited with code ' + code;
        logError(message);
        return next(message);
      } else {
        return next(null);
      }
    });
  });
};
