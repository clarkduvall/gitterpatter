(function() {
  var $window = $(window),
      height = $window.height(),
      width = $window.width(),
      $gitter = $('#gitter'),
      requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame;

  $.fn.transform = function(z, rot) {
    var transform = 'rotateZ(' + rot + 'deg) translateZ(' + z + 'px)';
    $(this).css('-webkit-transform', transform);
    $(this).css('-moz-transform', transform);
    $(this).css('transform', transform);
  };

  function Activity(data) {
    this.rot = Math.random() * 360;
    this.drot = Math.random() * 40 - 20;
    this.z = 1500 + Math.random() * 3000;
    this.dz = 0;
    this.opacity = 1;

    this.actor = data.actor;
    this.actorURL = data.actor.url.replace('users/', '')
                                  .replace('https://api.', '//');
    this.$el = this.createNode();
  }

  Activity.prototype.createNode = function() {
    var $wrapper = $('<div class="wrapper">'),
        $drop = $('<div class="drop">'),
        $cover = $('<div class="cover">'),
        $avatar = $('<img class="avatar">'),
        $profile = $('<a target="_blank" class="profile">');

    $avatar.attr('src', this.actor.avatar_url);
    $profile.attr('href', this.actorURL).text(this.actor.login);

    $drop.append($avatar).append($('<br>')).append($profile).append($cover);
    $wrapper.append($drop);

    $gitter.append($wrapper);

    $wrapper.css({
      position: 'absolute',
      top: Math.random() * height,
      left: Math.random() * width
    });

    return $drop;
  };

  Activity.prototype.remove = function() {
    this.$el.parent().remove();
  };

  Activity.prototype.render = function() {
    if (this.splatting) {
      this.$el.css('opacity', this.opacity);
    } else {
      this.$el.transform(this.z, this.rot);
      this.$el.css('opacity', 1 - Math.min(1, this.z / 1000));
    }
  };

  Activity.prototype.update = function(delta) {
    if (this.splatting) {
      this.opacity -= delta / 8;
    } else {
      this.rot += delta * this.drot;
      this.dz += delta * 100;
      this.z -= this.dz * delta * 2;

      if (this.z < 0) {
        this.z = 0;
        this.$el.addClass('splat');
        this.$el.find('.cover').addClass('splat');
        this.splatting = true;
      }
    }

    this.render();

    return this.opacity > 0;
  };

  function ActivityList() {
    this.activities = [];
  }

  ActivityList.prototype.update = function(delta) {
    var newActivities = [],
        activity;

    for (var i = 0; i < this.activities.length; ++i) {
      activity = this.activities[i];
      if (activity.update(delta))
        newActivities.push(activity);
      else
        activity.remove();
    }

    this.activities = newActivities;

    if (this.activities.length < 30)
      this.getMore();
  };

  ActivityList.prototype.getMore = function() {
    var that = this;

    $.get('events', function(data) {
      data = JSON.parse(data);
      $.each(data, function(index, value) {
        that.activities.push(new Activity(value));
      });
    });
  };

  function Animator(updateables) {
    this.lastStep = 0;
    this.updateables = updateables;
    this.boundStep = this.step.bind(this);
  }

  Animator.prototype.step = function(ms) {
    var delta = 0;

    if (ms) {
      delta = (ms - this.lastStep) * 0.001;
      this.lastStep = ms;
    }

    if (delta < .1) {
      for (var i = 0; i < this.updateables.length; ++i)
        this.updateables[i].update(delta);
    }

    requestAnimationFrame(this.boundStep);
  };

  $(function() {
    var list = new ActivityList(),
        animator = new Animator([list]);

    list.getMore();
    animator.step();
  });
})();
