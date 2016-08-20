/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

tactics_store = 'tactics';

// Init App
var app = new Framework7({
    modalTitle: 'ostSokker Mobile',
    // Enable Material theme
    material: true,
    init: false
});

// Expose Internal DOM library
var $$ = Dom7;

// Add main view
var mainView = app.addView('.view-main', {
    domCache: true
});

mainView.router.load({
    pageName: 'index',
    animatePages: false
});

$$('.new-tactic').on('click', function() {
  app.prompt('Enter the name of a new tactic', function(name) {
    createTactic(name);
    mainView.router.load({
      pageName: 'tactic',
      query: { id: name }
    });
  })
})

var page_main = function(page) {
  var tactics = getTactics();
  $(page.container).find('.tactics-list').empty();
  for(var i = 0 ; i < tactics.length ; i++) {
    $$(page.container).find('.tactics-list').append(
      '<li class="swipeout" data-key="' +tactics[i] + '">' +
      '<a href="#tactic?id=' + tactics[i] + '" class="item-link">' +
      '<div class="item-content swipeout-content">' +
      '<div class="item-inner">' +
      '<div class="item-title">' + tactics[i] + '</div>' +
      '</div></div></a>' +
      '<div class="swipeout-actions-left">' +
      '<a href="#" data-confirm="Are you sure you want to delete the tactic '+tactics[i]+'?" class="swipeout-delete">Delete</a>' +
      '<a href="#" class="swipeout-clone bg-blue action-clone" data-key="'+tactics[i]+'">Clone</a>' +
      '<a href="#" class="swipeout-clone bg-blue action-share" data-key="'+tactics[i]+'">Share</a>' +
      '</div></li>');
  }

  $('.tactics-list .action-clone').on('click', function(e) {
    var old = $(this).attr('data-key');
    app.prompt('Enter the name of new tactic', function(name) {
      cloneTactic(old, name);
      mainView.router.load({
        pageName: 'tactic',
        query: { id: name }
      });
    })
  })

  $('.tactics-list .action-share').on('click', function(e) {
    var key = $(this).attr('data-key');
    $.ajax({
      url:       'http://sokkermanager.tk:8081/tactic',
      method:    'post',
      data:      { tactic: getTactic(key) }
    }).done(function(result) {
      if(result.err) app.alert('Operation has failed');
      else app.alert(result.id);
    })
  })
}
app.onPageInit('main', function(page) {
  $$(page.container).find('.from-qr').on('click', function() {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        if(!result.cancelled)
        {
          if(result.format == "QR_CODE")
          {
            var tactic = result.text;
            if(tactic.length != 700) {
              app.alert('This is not a valid tactic. Sorry')
            } else {
              app.prompt('Enter the name of new tactic', function(name) {
                saveTactic(name, tactic);
                mainView.router.load({
                  pageName: 'tactic',
                  query: { id: name }
                });
              })
            }
          }
        }
      },
      function (error) {
        app.alert("Scanning failed: " + error);
      }
    );
  })

  page_main(page);
});
app.onPageReinit('main', page_main);

$$('.tactics-list').on('delete', function(e) {
  var key = $$(e.target).attr('data-key')
  deleteTactic(key);
})

var page_tactic = function(page) {
  $$(page.container).find('.navbar-inner .center').html(page.query.id);
  $$(page.container).find('.action-save').attr('data-key', page.query.id);
  window.editor.load(getTactic(page.query.id));
};
app.onPageInit('tactic', function(page) {
  window.editor = new Editor($(page.container).find('.editor'))
  for(var i = 2 ; i <= 11; i++) window.editor.createPlayer(i, i);

  $(page.container).find('.action-copy').on('click', window.editor.copy.bind(editor));
  $(page.container).find('.action-paste').on('click', window.editor.paste.bind(editor));
  $(page.container).find('.action-save').on('click', function() {
    var key = $(this).attr('data-key');
    saveTactic(key, window.editor.save());
  })
  $(window).on('resize', function() {
    window.editor.resetSize();
  })

  page_tactic(page);
});
app.onPageReinit('tactic', page_tactic);
app.onPageAfterAnimation('tactic', function() {
  window.editor.resetSize();
})

function getTactics() {
  var names = [];
  for(var i = 0 ; i < window.localStorage.length ; i++) {
    names.push(window.localStorage.key(i));
  }
  return names;
}

function getTactic(name) {
  var tacticStr = window.localStorage[name];
  if(!tacticStr) return null;
  else return JSON.parse(tacticStr);
}

function saveTactic(name, tactic) {
  window.localStorage.setItem(name, JSON.stringify(tactic));
}

function createTactic(name) {
  saveTactic(name, 'ADBCBEBDBECCCDDECECGDDDDDEEDFEFCFCEDECFEFCGCGDHCGEICICICIDHEJBJCJCICIDAFAFAGAHAHBEBGAGAGAHBGBGBGCGCGCECFCGDGDHDDDEDFEHEIEEEFEFFFFGHFHFHFIGIGAHAHAIAJAJAHAIAIBIBKCICICIBIBIDHDIDICJCKEGEHEIDKDLFIFJFJEJEKIIIIIIHJHJBKBLBKBMALCICKDKCLCMFKELDLDLDLFKEMELFMFMGKHMGLGMFMHKILIMIMIMILIMJMJMJNGBFCEDEEEFHBGBGAFBFEKBJAIBJBIDLAKAKBKCKCMALALBMCMENANBMBNDMDOANBODOEOFBDBFAHBIBICDCECGCIDJFCFEFGFHFIHDGEGFGHHIHDHEHFIHIIJDJEJFJHJILDLELFLGMHBGBGBHBJBLDFCGCICKCLFGFHFIFKFMHGGHGJGKHLIGIHIIHKHLJGJHJJJKJLMHLILJLKLLEJEKELFMGNFKFNGMGNHNILJNHMJOKNKMKMLOKOLOMKMMMOLOMOMLNLMONNNOOJOKOMNNOOEEEFEHEJEKGDGEGFGKGLJEIFJGIJJKKEJDKGJLKKLEKFLGKJLKNFNGMGNINJNENFNHNJNKHFHGHHHIHJIFIGIJIIIJKFKGKJKIKJLGLFLJLJLINFNGMININJOIOHNJOHOGPHPIOJPGPH');
}

function deleteTactic(name) {
  window.localStorage.removeItem(name);
}

function cloneTactic(name, newName) {
  saveTactic(newName, getTactic(name));
}

function init() {
  app.init();
}