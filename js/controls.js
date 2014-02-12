$(function() {
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
});
