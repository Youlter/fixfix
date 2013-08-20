(function() {
  var Gaze, Reading, Sample, Word, treedraw,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  treedraw = function(svg, parent, size, factor, callback) {
    var parents, recurse;
    if (!size) {
      return;
    }
    parents = [parent];
    recurse = function(parent, level) {
      var i, _i;
      if (level > 0) {
        level -= 1;
        for (i = _i = 1; 1 <= factor ? _i <= factor : _i >= factor; i = 1 <= factor ? ++_i : --_i) {
          recurse(svg.group(parent), level);
          if (!size) {
            return;
          }
        }
      } else {
        size -= 1;
        return callback(parent, size);
      }
    };
    return recurse(parent, Math.ceil(Math.log(size) / Math.log(factor)));
  };

  Word = (function() {
    function Word(word, left, top, right, bottom) {
      this.word = word;
      this.left = left;
      this.top = top;
      this.right = right;
      this.bottom = bottom;
    }

    Word.prototype.render_box = function(svg, parent) {
      return svg.rect(parent, this.left, this.top, this.right - this.left, this.bottom - this.top);
    };

    Word.prototype.render_word = function(svg, parent) {
      return svg.text(parent, (this.left + this.right) / 2, (this.top + this.bottom) / 2, this.word, {
        fontSize: this.bottom - this.top
      });
    };

    return Word;

  })();

  Gaze = (function() {
    function Gaze(x, y, pupil, validity) {
      this.x = x;
      this.y = y;
      this.pupil = pupil;
      this.validity = validity;
    }

    return Gaze;

  })();

  Sample = (function() {
    function Sample(time, blink, left, right) {
      this.time = time;
      this.blink = blink;
      this.left = left;
      this.right = right;
    }

    Sample.prototype.build_center = function() {
      if ((this.left.x != null) && (this.left.y != null) && (this.right.x != null) && (this.right.y != null)) {
        return this.center = new Gaze((this.left.x + this.right.x) / 2, (this.left.y + this.right.y) / 2, (this.left.pupil + this.right.pupil) / 2, this.left.validity > this.right.validity ? this.left.validity : this.right.validity);
      }
    };

    Sample.prototype.render = function(svg, parent, eye) {
      var gaze;
      gaze = this[eye];
      this.el = [];
      if ((gaze != null) && (gaze.x != null) && (gaze.y != null) && (gaze.pupil != null)) {
        return this[eye].el = svg.circle(parent, gaze.x, gaze.y, gaze.pupil, {
          id: eye[0] + this.time,
          "class": eye,
          'data-orig-x': gaze.x,
          'data-orig-y': gaze.y,
          'data-edit-x': gaze.x + 30,
          'data-edit-y': gaze.y + 30
        });
      }
    };

    Sample.prototype.render_intereye = function(svg, parent) {
      if ((this.left.x != null) && (this.left.y != null) && (this.right.x != null) && (this.right.y != null)) {
        return this.iel = svg.line(parent, this.left.x, this.left.y, this.right.x, this.right.y, {
          id: 'lr' + this.time,
          "class": 'inter'
        });
      }
    };

    Sample.prototype.render_saccade = function(svg, parent, eye, next) {
      var gaze1, gaze2;
      gaze1 = this[eye];
      gaze2 = next[eye];
      if ((gaze1 != null) && (gaze2 != null) && (gaze1.x != null) && (gaze1.y != null) && (gaze2.x != null) && (gaze2.y != null)) {
        return this[eye].sel = svg.line(parent, gaze1.x, gaze1.y, gaze2.x, gaze2.y, {
          id: eye[0] + this.time + '-' + next.time,
          "class": eye
        });
      }
    };

    Sample.prototype.move_to = function(state) {
      var el, eye, _i, _len, _ref, _results;
      _ref = ['left', 'right'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        eye = _ref[_i];
        el = this[eye].el;
        if (el) {
          el.setAttribute('cx', el.getAttribute('data-' + state + '-x'));
          _results.push(el.setAttribute('cy', el.getAttribute('data-' + state + '-y')));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Sample;

  })();

  Reading = (function() {
    function Reading(samples, flags) {
      this.samples = samples;
      this.flags = flags;
    }

    return Reading;

  })();

  window.FixFix = (function() {
    function FixFix(svg) {
      this.init = __bind(this.init, this);
      var shifted,
        _this = this;
      this.$svg = $(svg);
      this.data = {};
      $(this.$svg).svg({
        onLoad: this.init
      });
      $('input[type="range"]').change(function(evt) {
        var $number, $target;
        $target = $(evt.target);
        $number = $target.next('input[type="number"]');
        if (($target != null) && $number.val() !== $target.val()) {
          return $number.val($target.val());
        }
      });
      $('input[type="number"]').change(function(evt) {
        var $number, $target;
        $target = $(evt.target);
        $number = $target.prev('input[type="range"]');
        if (($number != null) && $number.val() !== $target.val()) {
          return $number.val($target.val());
        }
      });
      shifted = false;
      $(document).keydown(function(evt) {
        var sample, _i, _len, _ref;
        if (!(_this.data.gaze && evt.keyCode === 16)) {
          return;
        }
        if (evt.shiftKey && !shifted) {
          _ref = _this.data.gaze.samples;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            sample = _ref[_i];
            if (sample) {
              sample.move_to('edit');
            }
          }
          return shifted = true;
        }
      });
      $(document).keyup(function(evt) {
        var sample, _i, _len, _ref;
        if (!(_this.data.gaze && evt.keyCode === 16)) {
          return;
        }
        if (!evt.shiftKey && shifted) {
          _ref = _this.data.gaze.samples;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            sample = _ref[_i];
            if (sample) {
              sample.move_to('orig');
            }
          }
          return shifted = false;
        }
      });
    }

    FixFix.prototype.init = function(svg) {
      this.svg = svg;
      this.bb_group = this.svg.group('bb');
      return this.gaze_group = this.svg.group('gaze');
    };

    FixFix.prototype.load = function(file, type, opts) {
      var _this = this;
      opts = opts || {};
      opts.file = file;
      return ($.ajax({
        url: "" + type + ".json",
        dataType: 'json',
        data: opts,
        revivers: function(k, v) {
          if ((v != null) && typeof v === 'object') {
            if ("word" in v) {
              return new Word(v.word, v.left, v.top, v.right, v.bottom);
            } else if ("validity" in v) {
              return new Gaze(v.x, v.y, v.pupil, v.validity);
            } else if ("time" in v) {
              return new Sample(v.time, v.blink, v.left, v.right);
            } else if ("samples" in v) {
              return new Reading(v.samples, v.flags);
            }
          }
          return v;
        }
      })).then(function(data) {
        var sample, _i, _len, _ref;
        _this.data[type] = data;
        _this.data[type].opts = opts;
        switch (type) {
          case 'bb':
            return _this.render_bb();
          case 'gaze':
            if (_this.data.gaze.flags.center) {
              _ref = _this.data.gaze.samples;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                sample = _ref[_i];
                sample.build_center();
              }
            }
            return _this.render_gaze();
        }
      });
    };

    FixFix.prototype.render_bb = function() {
      var max, min, text_group, word, word_group, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      $(this.bb_group).empty();
      word_group = this.svg.group(this.bb_group, 'text');
      _ref = this.data.bb;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        word = _ref[_i];
        word.render_box(this.svg, word_group);
      }
      text_group = this.svg.group(this.bb_group, 'text');
      _ref1 = this.data.bb;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        word = _ref1[_j];
        word.render_word(this.svg, text_group);
      }
      min = this.data.bb[0].top;
      max = this.data.bb[0].bottom;
      _ref2 = this.data.bb;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        word = _ref2[_k];
        min = Math.min(min, word.top);
        max = Math.max(max, word.bottom);
      }
      return this.$svg.height(max + min);
    };

    FixFix.prototype.render_gaze = function() {
      var eye, eyes, samples, tree_factor, _i, _len,
        _this = this;
      $(this.gaze_group).empty();
      tree_factor = 50;
      samples = this.data.gaze.samples;
      eyes = ['left', 'right'];
      if (this.data.gaze.flags.center) {
        eyes.push('center');
      }
      for (_i = 0, _len = eyes.length; _i < _len; _i++) {
        eye = eyes[_i];
        treedraw(this.svg, this.svg.group(this.gaze_group), samples.length, tree_factor, function(parent, index) {
          var sample;
          sample = samples[index];
          if (sample != null) {
            return sample.render(_this.svg, parent, eye);
          }
        });
        if (this.data.gaze.flags.lines) {
          treedraw(this.svg, this.svg.group(this.gaze_group), samples.length - 1, tree_factor, function(parent, index) {
            var sample1, sample2;
            sample1 = samples[index];
            sample2 = samples[index + 1];
            if ((sample1 != null) && (sample2 != null) && !sample1.blink) {
              return sample1.render_saccade(_this.svg, parent, eye, sample2);
            }
          });
        }
      }
      if (this.data.gaze.flags.lines) {
        return treedraw(this.svg, this.svg.group(this.gaze_group), samples.length, tree_factor, function(parent, index) {
          var sample;
          sample = samples[index];
          if (sample != null) {
            return sample.render_intereye(_this.svg, parent);
          }
        });
      }
    };

    return FixFix;

  })();

  window.FileBrowser = (function() {
    function FileBrowser(fixfix, bb_browser, gaze_browser) {
      var $bb_selected, $gaze_selected, fixations, load_handler, load_timer, opts,
        _this = this;
      opts = {};
      $bb_selected = $();
      $gaze_selected = $();
      load_timer = null;
      fixations = $('#i-dt').is(':checked');
      $(bb_browser).fileTree({
        script: 'files/bb',
        multiFolder: false
      }, function(bb_file, $bb_newly_selected) {
        _this.bb_file = bb_file;
        $bb_selected.removeClass('selected');
        ($bb_selected = $bb_newly_selected).addClass('selected');
        return fixfix.load(bb_file, 'bb');
      });
      $(gaze_browser).fileTree({
        script: 'files/tsv',
        multiFolder: false
      }, function(gaze_file, $gaze_newly_selected) {
        _this.gaze_file = gaze_file;
        $gaze_selected.removeClass('selected');
        ($gaze_selected = $gaze_newly_selected).addClass('selected');
        return fixfix.load(_this.gaze_file, 'gaze', opts);
      });
      load_handler = function(evt) {
        var blink, dispersion, duration, timeout_handler;
        fixations = $('#i-dt').is(':checked');
        if (fixations) {
          dispersion = parseInt($('#dispersion_n').val(), 10);
          duration = parseInt($('#duration_n').val(), 10);
          blink = parseInt($('#blink_n').val(), 10);
          opts = {
            dispersion: dispersion,
            duration: duration,
            blink: blink
          };
        } else {
          opts = {};
        }
        if (_this.gaze_file) {
          clearTimeout(load_timer);
          timeout_handler = function() {
            return fixfix.load(_this.gaze_file, 'gaze', opts);
          };
        }
        return load_timer = setTimeout(timeout_handler, 500);
      };
      $('#i-dt-options input[type="range"], #i-dt-options input[type="number"]').bind('input', function(evt) {
        if (fixations) {
          return load_handler(evt);
        }
      });
      $('#i-dt').click('input', load_handler);
    }

    return FileBrowser;

  })();

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/
