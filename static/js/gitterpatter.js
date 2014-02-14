(function() {
  window.GP = window.GP || {};

  var $window = $(window),
      height = $window.height(),
      width = $window.width(),
      $gitter = $('#gitter'),
      eventTypes,
      requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame;

  $('#gitter, html, body').width($window.width())
                          .height($window.height());

  function repoLink(repo) {
    // Create the URL ourselves to avoid another API call.
    var repoUrl = repo.url.replace('https://api.', '//')
                          .replace('repos/', '')
    return '<a target="_blank" href="' + repoUrl + '">' + repo.name + '</a>';
  }

  function userLink(user) {
    return '<a target="_blank" href="' + user.html_url + '">' + user.login +
        '</a>';
  }

  function issueLink(issue) {
    return '<a target="_blank" href="' + issue.html_url + '">' + issue.title +
        '</a>';
  }

  function pullLink(pull) {
    return '<a target="_blank" href="' + pull.html_url + '">' + pull.title +
        '</a>';
  }

  function commentLink(comment, text) {
    return '<a target="_blank" href="' + comment.html_url + '">' + text +
        '</a>';
  }

  function releaseLink(release) {
    return '<a target="_blank" href="' + release.html_url + '">' +
        release.name + '</a>';
  }

  eventTypes = {
    CommitCommentEvent: function(data) {
      return commentLink(data.payload.comment, 'commented') +
          ' on a commit to ' + repoLink(data.repo);
    },

    CreateEvent: function(data) {
      var ref_type = data.payload.ref_type,
          message = 'created a ' + ref_type;

      if (ref_type === 'repository')
        return message;

      return message + ' in ' + repoLink(data.repo);
    },

    DeleteEvent: function(data) {
      return 'deleted a ' + data.payload.ref_type + ' in ' +
          repoLink(data.repo);
    },

    DeploymentEvent: function(data) {
      return 'created a deployment in ' + repoLink(data.repo);
    },

    DeploymentStatusEvent: function(data) {
      return 'updated the deployment status to ' + data.payload.state +
          ' in ' + repoLink(data.repo);
    },

    DownloadEvent: function(data) {
      return 'created a download in ' + repoLink(data.repo);
    },

    FollowEvent: function(data) {
      return 'followed ' + userLink(data.payload.target);
    },

    ForkEvent: function(data) {
      return 'forked ' + repoLink(data.repo) + ' to ' +
          repoLink(data.payload.forkee);
    },

    GollumEvent: function(data) {
      return 'created a wiki page in ' + repoLink(data.repo);
    },

    IssueCommentEvent: function(data) {
      return commentLink(data.payload.comment, 'commented') + ' on ' +
          issueLink(data.payload.issue);
    },

    IssuesEvent: function(data) {
      return data.payload.action + ' ' + issueLink(data.payload.issue);
    },

    MemberEvent: function(data) {
      return data.payload.action + ' ' + userLink(data.payload.member);
    },

    PublicEvent: function(data) {
      return 'open sourced ' + repoLink(data.repo) + '!';
    },

    PullRequestEvent: function(data) {
      return data.payload.action + ' ' + pullLink(data.payload.pull_request) +
          ' in ' + repoLink(data.repo);
    },

    PullRequestReviewCommentEvent: function(data) {
      return commentLink(data.payload.comment, 'commented') +
          ' on a pull request in ' + repoLink(data.repo);
    },

    PushEvent: function(data) {
      var size = data.payload.size;
      return 'pushed ' + size + ' commit' + (size > 1 ? 's' : '') + ' to ' +
          repoLink(data.repo);
    },

    ReleaseEvent: function(data) {
      return data.payload.action + ' release ' +
          releaseLink(data.payload.release) + ' to ' + repoLink(data.repo);
    },

    StatusEvent: function(data) {
      return 'changed status of a commit to ' + data.payload.state;
    },

    TeamAddEvent: function(data) {
      if (data.payload.user) {
        return 'added ' + userLink(data.payload.user) + ' to ' +
            data.payload.team.name;
      } else {
        return 'added ' + repoLink(data.payload.repository) + ' to ' +
            data.payload.team.name;
      }
    },

    WatchEvent: function(data) {
      return 'starred ' + repoLink(data.repo);
    },

    Error: function(data) {
      return data.error;
    },
  };

  $.fn.transform = function(z, rot) {
    var scale = Math.min(10, 1000 / (1000 - z)),
        transform = 'rotate(' + rot + 'deg) scale(' + scale + ',' + scale +')';
    $(this).css('-webkit-transform', transform);
    $(this).css('-moz-transform', transform);
    $(this).css('transform', transform);
  };

  function getQueryURL() {
    var search = document.location.search;
    if (search && search.match(/^\?url=/))
      return decodeURIComponent(search.replace('?url=', '').replace(/\/$/, ''));

    return '';
  }

  function EventStream(cb, newEventTime) {
    var queryURL = getQueryURL();

    this.events = [];
    this.ids = {};
    this.timer = 0;
    this.newEventTime = newEventTime || 1;
    this.callback = cb;
    this.setURL(queryURL || 'events');
  }

  EventStream.prototype.update = function(delta) {
    var ev;

    this.timer += delta;
    if (this.timer > this.newEventTime && this.events.length) {
      ev = this.events.shift();
      if (eventTypes[ev.type]) {
        this.callback(ev);
        this.timer = 0;
      }
      this.populate();
    }

    if (!this.events.length)
      this.populate();
  };

  EventStream.prototype.populate = function() {
    if (this.populating) return;

    var that = this;

    if (this.events.length < 10) {
      this.populating = true;
      this.fetch(function() {
        // Only check every 2 seconds.
        setTimeout(function() {
          that.populating = false;
          that.populate();
        }, 2000);
      });
    }
  };

  EventStream.prototype.setAuthHeader = function(header) {
    this.authHeader = header;
    this.setURL(this.rawURL);
  };

  EventStream.prototype.fetch = function(cb) {
    var that = this;

    this.request = $.ajax({
      dataType: 'json',
      url: this.url,
      beforeSend: function(req) {
        if (that.lastETag)
          req.setRequestHeader('If-None-Match', that.lastETag);
        if (that.authHeader)
          req.setRequestHeader('Authorization', that.authHeader);
      },

      success: function(data, text, req) {
        // If this is not new data, pretend like we got an empty list.
        if (req.status === 200) {
          that.lastETag = req.getResponseHeader('ETag');
        } else {
          data = [];
        }

        data = data.filter(function(item) {
          return !that.ids[item.id];
        });

        if (data.length) {
          $.each(data, function(index, value) {
            that.ids[value.id] = true;
            that.events.push(value);
          });
        } else if (req.status !== 200) {
          that.events.push({
            type: 'Error',
            error: 'No more events to load! For now...'
          });
        }
      },

      error: function(req) {
        if (req.status === 403) {
          // Repeat 5 times so we don't hammer github.
          for (var i = 0; i < 5; ++i) {
            that.events.push({
              type: 'Error',
              rateLimit: true,
              created_at: req.getResponseHeader('X-RateLimit-Reset') * 1000,
              error: 'You\'ve hit the Github API limit. ' +
                  ' The rain will begin again'
            });
          }
        } else if (req.status === 404) {
          for (var i = 0; i < 5; ++i) {
            that.events.push({
              type: 'Error',
              error: 'The repo/user/org you requested does not exist'
            });
          }
        } else {
          that.events.push({
            type: 'Error',
            error: 'An unknown error has occurred'
          });
        }
      },

      complete: function() {
        if (cb) cb();
      }
    });
  };

  EventStream.prototype.setURL = function(url) {
    // EventStream shouldn't touch the HTML but... whatever.
    $('.comp-text').text(url);

    this.url = 'https://api.github.com/' + url;
    this.rawURL = url;
    if (this.request) this.request.abort();
    this.populating = false;
    this.events = [];
    this.ids = {};
    delete this.lastETag;
    this.populate();
  };

  function Activity(data) {
    this.rot = Math.random() * 90 - 45;
    this.z = 1500 + Math.random() * 3000;
    this.dz = Math.random() * 2000;
    this.opacity = 1;

    if (data.actor) {
      this.actor = data.actor;
      // Create the URL ourselves to avoid another API call.
      this.actorURL = data.actor.url.replace('https://api.', '//')
                                    .replace('users/', '');
    }

    this.$el = this.createNode(data);
  }

  Activity.prototype.fadeRate = 8;

  Activity.prototype.createNode = function(data) {
    var $wrapper = $('<div class="wrapper">'),
        $drop = $('<div class="drop">'),
        $cover = $('<div class="cover">'),
        $content = $('<div class="content">'),
        $avatar = $('<img class="avatar">'),
        $avatarWrapper = $('<a target="_blank">'),
        $profile = $('<a target="_blank" class="profile">'),
        $login;

    $wrapper.addClass(data.type);

    $avatarWrapper.append($avatar);

    $content.append($avatarWrapper)
            .append('<br>')

    if (this.actor) {
      $avatarWrapper.attr('href', this.actorURL);
      $avatar.attr('src', this.actor.avatar_url);
      $profile.attr('href', this.actorURL).text(this.actor.login);

      $content.append($profile);
    } else {
      $avatarWrapper.attr('href', 'https://github.com/clarkduvall');
      $avatar.attr('src', 'https://gravatar.com/avatar/8cd29bab079d31af82c84d' +
                          '95e8ff25ba?d=https%3A%2F%2Fidenticons.github.com%2' +
                          'F58b20f14d8c0c808eff1919790056e92.png&r=x');
    }

    $content.append(' ' + eventTypes[data.type](data) +
        (data.created_at ? ' ' + moment(data.created_at).fromNow() : ''));

    if (data.rateLimit) {
      $content.append('. ');
      $login = $('<a>');
      $login.attr('href', '#');

      $login.click(function(e) {
        e.preventDefault();
        $('.login-controls form').slideDown('fast');
      });

      $login.text('Login');
      $content.append($login)
              .append(' to increase API limit');
    }

    $drop.append($content)
         .append($cover);

    $wrapper.append($drop);

    $wrapper.css({
      position: 'absolute',
      top: Math.random() * height,
      left: Math.random() * width
    });

    $gitter.append($wrapper);

    // TODO: figure out element flash.
    $wrapper.hide();

    return $drop;
  };

  Activity.prototype.remove = function() {
    this.$el.parent().remove();
  };

  Activity.prototype.render = function() {
    this.$el.parent().show();

    if (this.splatting) {
      // Firefox, what the heck? I have to round to 100ths place.
      this.$el.css('opacity', Math.floor(this.opacity * 100) / 100);
    } else {
      this.$el.transform(this.z, this.rot);
      this.$el.css('opacity', 1 - Math.min(1, this.z / 1000));
    }
  };

  Activity.prototype.update = function(delta) {
    if (this.splatting) {
      this.opacity -= delta / this.fadeRate;
    } else {
      this.dz += delta * 100;
      this.z -= this.dz * delta;

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
  };

  ActivityList.prototype.add = function(data) {
    this.activities.push(new Activity(data));
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
        stream = new EventStream(list.add.bind(list), 1),
        animator = new Animator([list, stream]);

    animator.step();

    // These are used in controls.js.
    GP.stream = stream;
    GP.animator = animator;
    GP.list = list;
  });

  GP.Activity = Activity;
})();
