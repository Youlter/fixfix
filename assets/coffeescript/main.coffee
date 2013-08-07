class window.FixFix
  constructor: (svg) ->
    @$svg = $(svg)
    $(@$svg).svg(onLoad: @init)

  init: (@svg) ->

  load: (bb_file, gaze_file) ->
    ($.ajax
      url: 'data.json'
      data:
        bb: bb_file
        gaze: gaze_file
    ).then (@data) =>
      @render()

  file_browser: ->
    $('#bb_browser').fileTree {
        script: 'bb_files'
        multiFolder: false,
      },
      (bb_file) ->
        console.log bb_file

  render: ->
    @render_bb()

  render_bb: ->
    for word in @data.bb
      console.log word
