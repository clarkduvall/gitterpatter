$(function() {
  window.GP = window.GP || {};

  var $rates = $('.rate'),
      $fades = $('.fade'),
      $comps = $('.comp'),
      $select  = $('.comp-select');

  $rates.click(function() {
    $rates.removeClass('selected');
    $(this).addClass('selected');
    $('.rate-text').text($(this).data('text'));
  });

  $fades.click(function() {
    $fades.removeClass('selected');
    $(this).addClass('selected');
    $('.fade-text').text($(this).data('text'));
  });

  $select.change(function() {
    var val = $select.find(':selected').val();
    $comps.hide();
    $('.' + val).show();
  });

  $('.rate').click(function() {
    GP.stream.newEventTime = parseFloat($(this).data('rate'));
  });

  $('.fade').click(function() {
    GP.Activity.prototype.fadeRate = parseInt($(this).data('rate'), 10);
  });

  $('.composition').submit(function(e) {
    e.preventDefault();

    var val = $('.comp-select :selected').val(),
        $div = $('.' + val),
        url = '';

    if (val === 'all') {
      url = 'events';
    } else if (val === 'repo') {
      url = 'repos/' + $div.find('input[name="user"]').val() + '/' +
          $div.find('input[name="repo"]').val() + '/events';
    } else if (val === 'org') {
      url = 'orgs/' + $div.find('input[name="org"]').val() + '/events';
    } else if (val === 'rec-user') {
      url = 'users/' + $div.find('input[name="user"]').val() +
          '/received_events';
    } else if (val === 'perf-user') {
      url = 'users/' + $div.find('input[name="user"]').val() + '/events';
    }

    GP.stream.setURL(url);

    if (history.pushState)
      history.pushState({}, '', '?url=' + encodeURIComponent(url));
  });
});
