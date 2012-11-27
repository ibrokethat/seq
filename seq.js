/**
  @module  async sequence pipeline based upon promises
*/

var async   = require("async");
var func    = require("func");
var Promise = async.Promise;
var when    = async.when;
var bind    = func.bind;
var partial = func.partial;


/**
  @description  Binds incoming and outgoing parameters from a data
                structure composed of functions onto a sequence of promises
                Enables chaining functions that return a value
                with functions that return a promise as all function responses
                are coerced into being promises.
                Kind of monadish without really being one
  @param        {function} unit
  @param        {promise} output
  @param        {object} next
  @param        {any} input
*/
function step(unit, output, next, input) {

  function process(response, method, value) {

    if (next) {
      step(unit, output, next[response][1], next[response][0](value));
    }
    else {
      output[method](value);
    }

  }

  unit(input).then(
    partial(process, "CMD_OK", "resolve"),
    partial(process, "CMD_ERROR", "reject")
  );

}



/**
  @description  Composes a function from unit & step (bind) functions
                and a data structure representing a sequence of functions.
  @param        {function} step
  @param        {function} unit
  @param        {object} sequence
  @return       {promise}
*/
function sequence(step, unit, sequence) {

  return function (value) {

    var output = Promise.spawn();

    step(unit, output, sequence[1], sequence[0](value));

    return output;

  }

}


exports.seq      = partial(sequence, step, when);
exports.step     = step;
exports.sequence = sequence;
