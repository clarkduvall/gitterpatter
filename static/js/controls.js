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

  $('.login-controls form').submit(function(e) {
    e.preventDefault();

    var $this = $(this),
        username = $this.find('input[name="username"]').val(),
        password = $this.find('input[name="password"]').val(),
        authHeader = 'Basic ' + btoa(username + ':' + password);

    $.ajax({
      dataType: 'json',
      url: 'https://api.github.com/users/' + username,
      beforeSend: function(req) {
        req.setRequestHeader('Authorization', authHeader);
      },

      success: function() {
        $('.logged-in-user').text(username);
        $('.login-msg').hide();
        $('.logout-msg').show();
        $('.login-controls form').slideUp('fast');
        GP.stream.setAuthHeader(authHeader);
      },

      error: function() {
        $('.login-error').show();
      }

    });
  });

  $('.login').click(function(e) {
    e.preventDefault();

    var $form = $('.login-controls form');
    $('.login-error').hide();

    if ($form.is(':visible'))
      $form.slideUp('fast');
    else
      $form.slideDown('fast');
  });

  $('.logout').click(function(e) {
    e.preventDefault();

    GP.stream.setAuthHeader('');
    $('.login-msg').show();
    $('.logout-msg').hide();
  });
});
