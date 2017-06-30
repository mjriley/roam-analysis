#!/usr/bin/env node
'use strict';
let lol = require('lol-js');
let _ = require('lodash');

const API_KEY = '1031d40d-6f7c-4f43-b3a8-eb4b86b441f1';

// clickclickboom
// const SUMMONER_ID = 19037172;

// badcause
const SUMMONER_ID = 29297306;

// technically the laning phase could start around 1:40, but an extended invade could throw off statistics.
// By 2:10, everyone should be in lane, prior to the first normal jungle gank paths
const TIME_LANING_PHASE_START = 130; // in seconds

const CHAMP_ZIGGS = 115;
const CHAMP_SONA = 37;
const CHAMP_LUX = 99;

let lolClient = lol.client({
    apiKey: API_KEY
});

let champMap = {};

// function processSummoners(summonerTable) {
//     let {
//         id,
//         name,
//         profileIconId,
//         revisionData,
//         summonerLevel
//     } = summonerTable['badcause'];

//     console.log('User id is: ' + id + ', summonerLevel is: ' + summonerLevel);
// }

// lolClient.getSummonersByName('NA', ['badcause']).then(processSummoners);

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_MINUTE = 1000;

function getTimestampFromXDaysAgo(numDays) {
    const numMs =
        numDays *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MILLIS_PER_MINUTE;
    return Date.now() - numMs;
}

function populateChampionData() {
    return lolClient
        .getChampions('NA', { dataById: true })
        .then(storeChampions);
}

function storeChampions({ data }) {
    champMap = data;
}

function getMatchlist() {
    return lolClient
        .getMatchlistBySummoner('NA', SUMMONER_ID, {
            // championIds: [CHAMP_ZIGGS],
            // rankedQueues: ['RANKED_SOLO_5x5']
            rankedQueues: ['TEAM_BUILDER_RANKED_SOLO'],
            // seasons: ['SEASON2016'],
            beginTime: getTimestampFromXDaysAgo(7)
        })
        .then(processMatches);
}

function retrieveMatch(id, summonerId) {
    // need to map the summonerId to the participant ID
    return lolClient.getMatch('NA', id);
    // .then(match => getParticipantId(match, SUMMONER_ID));
}

function getParticipantId(match, summonerId) {
    return match.participantIdentities.find(
        id => id.player.summonerId === summonerId
    ).participantId;
}

function getParticipantInformation(match, summonerId) {
    const identity = match.participantIdentities.find(
        id => id.player.summonerId === summonerId
    );

    return {
        participantId: identity.participantId
    };
}

function didWin(match, participantId) {
    const teamIndex = getTeamIndex(
        match.participants[participantId - 1].teamId
    );
    return match.teams[teamIndex].winner;
}

// team ids are either 100 (blue) or 200 (red).
// it is more useful to translate this into an array index of 0 or 1
function getTeamIndex(teamId) {
    return teamId / 100 - 1;
}

function processMatches({ matches, totalGames }) {
    let parsedMatches = _.map(matches, normalizeMatch);

    console.log('total games played: ', totalGames);
    console.log('matches are: ', parsedMatches);
}

function processMatch(match, summonerId) {
    const participantId = getParticipantId(match, summonerId);
    return {
        lane: 'MID',
        role: 'SOLO',
        champion: 'Lux',
        winner: didWin(match, participantId),
        hadCSLeadAt10: true,
        hadCSLeadAt15: true,
        hadEffectiveRoam: true,
        elo: gold,
        firstTowerKill: true,
        timestamp: 0
    };
}

function normalizeMatch(match) {
    return _.assignWith({}, match, (objValue, srcValue, key) => {
        switch (key) {
            case 'champion':
                return champMap[srcValue].name;
            case 'timestamp':
                return new Date(srcValue);
        }
    });
}

// populateChampionData().then(getMatchlist);

// retrieveMatch(2524787112).then(console.log);
retrieveMatch(2525345554).then(console.log); // my lux win
