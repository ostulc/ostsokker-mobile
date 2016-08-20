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

String.prototype.replaceAt=function(index, character) {
  return this.substr(0, index) + character + this.substr(index+character.length);
}


var Editor = function($el) {
  this.$el = $el;
  this.players = {};
  this.ball = {
    x: 2,
    y: 3
  }

  this.resetSize();
  
  var element = this.$ballEl.get(0);
  interact(element)
    .draggable({
      inertia: false,
      restrict: {
        restriction: element.parentNode,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
        endOnly: true
      }
    })
    .on("dragmove", this.ballMoved.bind(this))
    .on("dragend", this.ballDropped.bind(this));
}

Editor.prototype.resetSize = function() {
  Editor.minX = this.$el.width() * Editor.perc.minX;
  Editor.maxX = this.$el.width() * Editor.perc.maxX;

  Editor.minY = this.$el.height() * Editor.perc.minY;
  Editor.maxY = this.$el.height() * Editor.perc.maxY;

  Editor.dy = (Editor.maxY - Editor.minY) / 15;
  Editor.dx = (Editor.maxX - Editor.minX) / 14;

  Editor.ballMinX = this.$el.width() * Editor.perc.ballMinX;
  Editor.ballMaxX = this.$el.width() * Editor.perc.ballMaxX;

  Editor.ballMinY = this.$el.height() * Editor.perc.ballMinY;
  Editor.ballMaxY = this.$el.height() * Editor.perc.ballMaxY;

  Editor.ballDx = (Editor.ballMaxX - Editor.ballMinX) / 4;
  Editor.ballDy = (Editor.ballMaxY - Editor.ballMinY) / 6;
  
  var pos = this.$el.offset();
  this.$ballEl = this.$el.find(".ball");
  this.$ballEl.css({ top: Editor.ballMinY + this.ball.y*Editor.ballDy, left: Editor.ballMinX + this.ball.x*Editor.ballDx });

  this.updatePlayers();
}

Editor.prototype.createPlayer = function(id, label) {
  $player = $("<div class=\"player player-" + id + "\"><span class=\"label\">" + label + "</span></div>");
  $player.data("id", id);
  $player.css({ top: Editor.minY, left: Editor.minX });

  this.players[id] = {
    id: id,
    label: label,
    positions: [],
    $el: $player
  };
  for(var i = 0 ; i < 35 ; i++) this.players[id].positions.push({ x: 0, y: 0 });
  this.$el.append($player);
  
  var element = $player.get(0);
  interact(element)
    .draggable({
      snap: {
        targets: [
          this.closest.bind(this)
        ]
      },
      inertia: false,
      restrict: {
        restriction: element.parentNode,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
        endOnly: true
      }
    })
    .on("dragmove", this.moved.bind(this));
}

Editor.prototype.moved = function(event) {
  var $target = $(event.target);
  var data = this.players[$target.data("id")];
  
  var pos = 5*this.ball.y + this.ball.x;
  
  data.positions[pos].x += Math.round(event.dx / Editor.dx);
  data.positions[pos].y += Math.round(event.dy / Editor.dy);
  
  if(typeof this.onPlayerMoved == 'function') this.onPlayerMoved($target.data("id"), this.ball.x, this.ball.y);
  
  $target.css({ top: Editor.minY + Editor.dy*data.positions[pos].y, left: Editor.minX + Editor.dx*data.positions[pos].x });
}

Editor.prototype.closest = function(x, y) {
  var pos = this.$el.offset();
  
  var i = Math.round((y - Editor.minY - pos.top) / Editor.dy);
  var j = Math.round((x - Editor.minX - pos.left) / Editor.dx);
  
  i = Math.max(i, 0);
  i = Math.min(i, 15);
  j = Math.max(j, 0);
  j = Math.min(j, 14);
  
  return {
    x: Math.round(pos.left + Editor.minX + j*Editor.dx),
    y: Math.round(pos.top + Editor.minY + i*Editor.dy),
    tx: j,
    ty: i,
    range: Infinity
  }
}

Editor.prototype.ballMoved = function(event) {
  this.ball.x += event.dx / Editor.ballDx;
  this.ball.y += event.dy / Editor.ballDy;
  
  this.updateBall();
}

Editor.prototype.ballDropped = function(event) {
  this.ball.x = Math.round(this.ball.x);
  this.ball.y = Math.round(this.ball.y);
  
  this.ball.x = Math.min(4, this.ball.x);
  this.ball.x = Math.max(0, this.ball.x);
  this.ball.y = Math.min(6, this.ball.y);
  this.ball.y = Math.max(0, this.ball.y);
  
  this.updateBall();
}

Editor.prototype.updateBall = function() {
  this.$ballEl.css({ top: Editor.ballMinY + Editor.ballDy*this.ball.y, left: Editor.ballMinX + Editor.ballDx*this.ball.x });
  this.updatePlayers();
  
  if(typeof this.onBallMoved == 'function') this.onBallMoved();
}

Editor.prototype.updatePlayers = function() {
  var x = this.ball.x;
  var y = this.ball.y;
  var x1 = Math.floor(x);
  var x2 = x1+1;
  var y1 = Math.floor(y);
  var y2 = y1+1;
  
  for(var id in this.players) {
    var xxy1 = this.get(id,x1,y1).x*(x2-x)/(x2-x1) + this.get(id,x2,y1).x*(x-x1)/(x2-x1);
    var xxy2 = this.get(id,x1,y2).x*(x2-x)/(x2-x1) + this.get(id,x2,y2).x*(x-x1)/(x2-x1);
    var xxy = xxy1*(y2-y)/(y2-y1) + xxy2*(y-y1)/(y2-y1);
    
    var yxy1 = this.get(id,x1,y1).y*(x2-x)/(x2-x1) + this.get(id,x2,y1).y*(x-x1)/(x2-x1);
    var yxy2 = this.get(id,x1,y2).y*(x2-x)/(x2-x1) + this.get(id,x2,y2).y*(x-x1)/(x2-x1);
    var yxy = yxy1*(y2-y)/(y2-y1) + yxy2*(y-y1)/(y2-y1);
    
    this.players[id].$el.css({ top: Editor.minY + Editor.dy*yxy, left: Editor.minX + Editor.dx*xxy });
  }
}

Editor.prototype.get = function(id, ballX, ballY) {
  ballX = Math.min(ballX, 4);
  ballX = Math.max(ballX, 0);
  ballY = Math.min(ballY, 6);
  ballY = Math.max(ballY, 0);
  return this.players[id].positions[ballY*5 + ballX];
}

Editor.prototype.load = function(tact) {
  for(var id in this.players) {
    var player = this.players[id];
    if(tact.length == 0) break;
    
    var ptact = tact.substring(0, 70);
    var tact = tact.substring(70);
    
    for(var bx = 0 ; bx < 5 ; bx++) {
      for(var by = 0 ; by < 7 ; by++) {
        var i = (6-by)*5 + bx;
        var y = 15 - ptact.charCodeAt(2*i) + 65;
        var x = ptact.charCodeAt(2*i+1) - 65;
        
        player.positions[by*5+bx].x = x;
        player.positions[by*5+bx].y = y;
      }
    }
  }
  
  this.updatePlayers();
}

Editor.prototype.save = function() {
  var tact = new Array(701).join("A");
  
  var pid = 0;
  for(var id in this.players) {
    var player = this.players[id];
    
    for(var bx = 0 ; bx < 5 ; bx++) {
      for(var by = 0 ; by < 7 ; by++) {
        var i = (6-by)*5 + bx;
        var y = String.fromCharCode(15 - player.positions[by*5+bx].y + 65);
        var x = String.fromCharCode(player.positions[by*5+bx].x + 65);
        
        tact = tact.replaceAt(70*pid + 2*i, y);
        tact = tact.replaceAt(70*pid + 2*i+1, x);
      }
    }
    
    pid++;
  }
  
  return tact;
}

Editor.prototype.copy = function() {
  this.copied = [];
  for(var id in this.players) {
    this.copied.push(this.get(id, this.ball.x, this.ball.y));
  }
}
Editor.prototype.paste = function() {
  if(this.copied) {
    var i = 0;
    for(var id in this.players) {
      this.players[id].positions[this.ball.y*5 + this.ball.x].x = this.copied[i].x;
      this.players[id].positions[this.ball.y*5 + this.ball.x].y = this.copied[i++].y;
    }
    this.updatePlayers();
    if(typeof this.onPlayerMoved == 'function') this.onPlayerMoved(-1, this.ball.x, this.ball.y);
  }
}


Editor.minX = 20;
Editor.maxX = 510;

Editor.minY = 28;
Editor.maxY = 697;

Editor.dy = (Editor.maxY - Editor.minY) / 15;
Editor.dx = (Editor.maxX - Editor.minX) / 14;

Editor.ballMinX = 69;
Editor.ballMaxX = 456;

Editor.ballMinY = 68;
Editor.ballMaxY = 691;

Editor.ballDx = (Editor.ballMaxX - Editor.ballMinX) / 4;
Editor.ballDy = (Editor.ballMaxY - Editor.ballMinY) / 6;

Editor.perc = {};

Editor.perc.minX = 0.03649635036496350365;
Editor.perc.maxX = 0.93065693430656934307;

Editor.perc.minY = 0.03580562659846547315;
Editor.perc.maxY = 0.89130434782608695652;

Editor.perc.dy = (Editor.maxY - Editor.minY) / 15;
Editor.perc.dx = (Editor.maxX - Editor.minX) / 14;

Editor.perc.ballMinX = 0.12591240875912408759;
Editor.perc.ballMaxX = 0.83211678832116788321;

Editor.perc.ballMinY = 0.08695652173913043478;
Editor.perc.ballMaxY = 0.88363171355498721228;