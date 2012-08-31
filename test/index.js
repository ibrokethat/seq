var assert    = require("assert"),
    sinon     = require("sinon"),
    sequences = require("../ibt-seq"),
    async     = require("ibt-async"),
    seq       = sequences.seq,
    step      = sequences.step,
    sequence  = sequences.sequence,
    Promise   = async.Promise,
    fakes;


function makeResolver() {
  return sinon.spy(function (v) {
    var p = Promise.spawn();
    setTimeout(function(){
      p.resolve(v);
    }, 10);
    return p;
  });
}

function makeRejector() {
  return sinon.spy(function (v) {
    var p = Promise.spawn();
    setTimeout(function(){
      p.reject(v);
    }, 10);
    return p;
  });
}


describe("test seq module: ", function() {


  beforeEach(function() {

    fakes = sinon.sandbox.create();

  });

  afterEach(function() {

    fakes.restore();

  });


  describe("function seq", function() {


    it("should run an async sequence where everything resolves", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [makeResolver(), {
          "CMD_OK": [makeResolver(), {
              "CMD_OK": [makeResolver()],
              "CMD_ERROR": [makeResolver()]
              },
          ],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];

      logUserIn = seq(s);

      logUserIn("simon").then(function(value) {

        assert.equal("simon", value);
        assert.equal(1, s[0].callCount);
        assert.equal(1, s[1].CMD_OK[0].callCount);
        assert.equal(1, s[1].CMD_OK[1].CMD_OK[0].callCount);
        assert.equal(1, s[1].CMD_OK[1].CMD_OK[1].CMD_OK[0].callCount);

        assert.equal(0, s[1].CMD_ERROR[0].callCount);
        assert.equal(0, s[1].CMD_OK[1].CMD_ERROR[0].callCount);
        assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_ERROR[0].callCount);

        done();
      });

    });


    it("should run an async sequence where the first function rejects", function(done) {

      var s, logUserIn;

      s = [makeRejector(), {
        "CMD_OK": [makeResolver(), {
          "CMD_OK": [makeResolver(), {
              "CMD_OK": [makeResolver()],
              "CMD_ERROR": [makeResolver()]
              },
          ],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];

      logUserIn = seq(s);

      logUserIn("simon").then(
        function(value) {

          assert.equal("simon", value);
          assert.equal(1, s[0].callCount);
          assert.equal(0, s[1].CMD_OK[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_OK[0].callCount);

          assert.equal(1, s[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_ERROR[0].callCount);

          done();

        },
        function(value) {

        }
      );

    });


    it("should run an async sequence where the second function rejects", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [makeRejector(), {
          "CMD_OK": [makeResolver(), {
            "CMD_OK": [makeResolver()],
            "CMD_ERROR": [makeResolver()]
          }],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];


      logUserIn = seq(s);

      logUserIn("simon").then(
        function(value) {

          assert.equal("simon", value);
          assert.equal(1, s[0].callCount);
          assert.equal(1, s[1].CMD_OK[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_OK[0].callCount);

          assert.equal(0, s[1].CMD_ERROR[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_ERROR[0].callCount);

          done();
        },
        function() {}
      );

    });

    it("should run an async sequence where the third function rejects", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [makeResolver(), {
          "CMD_OK": [makeRejector(), {
            "CMD_OK": [makeResolver()],
            "CMD_ERROR": [makeResolver()]
          }],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];


      logUserIn = seq(s);

      logUserIn("simon").then(
        function(value) {

          assert.equal("simon", value);
          assert.equal(1, s[0].callCount);
          assert.equal(1, s[1].CMD_OK[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_OK[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_OK[0].callCount);

          assert.equal(0, s[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_ERROR[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_OK[1].CMD_ERROR[0].callCount);

          done();
        },
        function() {}
      );

    });

    it("should run an async sequence where the last function rejects", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [makeResolver(), {
          "CMD_OK": [makeResolver(), {
            "CMD_OK": [makeRejector()],
            "CMD_ERROR": [makeResolver()]
          }],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];


      logUserIn = seq(s);

      logUserIn("simon").then(
        function() {},
        function(value) {

          assert.equal("simon", value);
          assert.equal(1, s[0].callCount);
          assert.equal(1, s[1].CMD_OK[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_OK[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_OK[1].CMD_OK[0].callCount);

          assert.equal(0, s[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_ERROR[0].callCount);

          done();
        }
      );

    });



    it("should run a sequence composed of both synchronous and async functions", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [sinon.stub().returns("simon"), {
          "CMD_OK": [makeResolver(), {
              "CMD_OK": [sinon.stub().returns("simon")],
              "CMD_ERROR": [makeResolver()]
              },
          ],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];

      logUserIn = seq(s);

      logUserIn("simon").then(
        function(value) {

          assert.equal("simon", value);
          assert.equal(1, s[0].callCount);
          assert.equal(1, s[1].CMD_OK[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_OK[0].callCount);
          assert.equal(1, s[1].CMD_OK[1].CMD_OK[1].CMD_OK[0].callCount);

          assert.equal(0, s[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_ERROR[0].callCount);
          assert.equal(0, s[1].CMD_OK[1].CMD_OK[1].CMD_ERROR[0].callCount);

          done();
        },
        function(value) {}
      );

    });


    it("should reject it's output promise if the last function in the sequence rejects", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [makeResolver(), {
          "CMD_OK": [makeRejector(), {
            "CMD_OK": [makeResolver()],
            "CMD_ERROR": [makeRejector()]
          }],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];


      logUserIn = seq(s);

      logUserIn("simon").then(
        function() {},
        function(value) {

          assert.equal("simon", value);

          done();
        }
      );

    });


    it("should reject it's output promise if the last function in the sequence rejects", function(done) {

      var s, logUserIn;

      s = [makeResolver(), {
        "CMD_OK": [makeResolver(), {
          "CMD_OK": [makeRejector(), {
            "CMD_OK": [makeResolver()],
            "CMD_ERROR": [makeRejector()]
          }],
          "CMD_ERROR": [makeResolver()]
        }],
        "CMD_ERROR": [makeResolver()]
      }];


      logUserIn = seq(s);

      logUserIn("simon").then(
        function() {},
        function(value) {

          assert.equal("simon", value);

          done();
        }
      );

    });

  });

});
