"use strict";

(function (fp, document_, maquette_, window_) {

// Constants

var h = maquette.h;
var PGA_TOUR_URL = "https://statdata.pgatour.com";
var CURRENT_TOURNAMENT_API = `${PGA_TOUR_URL}/r/current/message.json`;
var TOURNAMENT_API = `${PGA_TOUR_URL}/r/$tid/leaderboard-v2mini.json`;
var TIMEOUT = 60000; // 1 minute 

// State

var state = {
  leaderboard: {
    tour_name: "Loading"
  , tournament_name: "Loading"
  , players: []
  }
};

function setState(state_) {
  state = { ...state, ...state_ };
  return state;
}

function getState() {
  return state;
}

// Fetch Data

function getData() {
  return fetch(`${CURRENT_TOURNAMENT_API}`)
           .then(r => r.json())
           .then(r => r.tid)
           .then(tid => fetch(TOURNAMENT_API.replace("$tid",tid)))
           .then(r => r.json())
           .then(setState);
}

// Render

function render() {
  var { leaderboard, ...state } = getState();
  var { tour_name, tournament_name, players } = leaderboard;
  return h("div", [ 
    h("h1", ["PGA Tour Leaderboard for Golf Game"])
  , h("button", { class: "pure-button pure-button-primary", onclick: getData }, ["Refresh Data"])
  , renderLabels(tour_name, tournament_name)
  , renderTable(players)
  ]);
}

function renderLabels(tourName, tournamentName) {
  return h("div", [
  , h("p", [`Last updated: ${ new Date() }`])
  , h("p", [`Tour name: ${ tourName }`])
  , h("p", [`Tournament name: ${ tournamentName }`])
  ]);
}

function renderPlayer({ current_position, player_bio, player_id, rounds, total, total_strokes }) {
  var { country, first_name, last_name } = player_bio;
  return h("tr", { key: player_id }, [
    h("td", [current_position])
  , h("td", [total || "0"])
  , h("td", [`${ first_name } ${ last_name }`])
  , h("td", [country || ""])
  , h("td", [fp.compose(
      fp.join(",")
    , fp.map(fp.getOr("X", "strokes"))
    )(rounds)
  ])
  , h("td", [total_strokes || "0"])
  ]);
}

function renderTable(players) {
 return h("table", { class: "pure-table pure-table-horizontal" }, [
 , h("thead", [
     h("tr", [
       h("th", ["Position"])
     , h("th", ["Par"])
     , h("th", ["Name"])
     , h("th", ["Country"])
     , h("th", ["Rounds"])
     , h("th", ["Total"])
     ])
   ])
 , h("tbody", fp.compose(
     fp.map(renderPlayer)
   , fp.sortBy(ordPlayer)
   )(players))
 ]);
}


function ordPlayer({ current_position, player_bio }) {
  var { first_name, last_name } = player_bio;
  return `${ current_position }${ first_name } ${ last_name }`;
}

// Main

function main() {
  console.log("app running ...");
  var projector = maquette.createProjector();
  projector.append(document_.body, render);
  window_.setInterval(function () {
    getData().then(projector.scheduleRender);
  }, TIMEOUT);
  getData().then(projector.scheduleRender);
}

document_.addEventListener("DOMContentLoaded", main);

}).call(this, _, document, maquette, window);
