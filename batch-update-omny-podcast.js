const request = require('request');
const promiseSerial = require('promise-serial');
require('dotenv').config();

const MEGAPHONE_API_PODCAST_URL = process.env.MEGAPHONE_API_PODCAST_URL || "";
const MEGAPHONE_API_TOKEN = process.env.MEGAPHONE_API_TOKEN || "";
const OMNYSTUDIO_MANAGEMENT_API_PODCAST_URL = process.env.OMNYSTUDIO_MANAGEMENT_API_PODCAST_URL || "";
const OMNYSTUDIO_MANAGEMENT_API_TOKEN = process.env.OMNYSTUDIO_MANAGEMENT_API_TOKEN || "";

const megaphoneApi = request.defaults({
    headers: {
        'Authorization': `Token token=${MEGAPHONE_API_TOKEN}`
    }
});

const omnyStudioManagementApi = request.defaults({
    headers: {
        'Authorization': `OmnyToken ${OMNYSTUDIO_MANAGEMENT_API_TOKEN}`
    }
});

// Get all episoes of a program from Omny Studio

const omnyStudioEpisodes = require('./airtalk-omnystudio-stitched.json');
console.log(omnyStudioEpisodes.Clips.length);

// Get all episodes of a program from Megaphone

const megaphoneEpisodes = require('./airtalk-megaphone.json');
console.log(megaphoneEpisodes.length);

// Filter to only the episodes that have midroll

const megaphoneEpisodesWithMidroll = megaphoneEpisodes.filter(episode => episode.insertionPoints.length > 0);
console.log(megaphoneEpisodesWithMidroll.length);

// For every episode, find the equivalent episode in Omny
const matchedEpisodes = [];
const unmatchedEpisodes = [];
megaphoneEpisodesWithMidroll.forEach(megaphoneEpisode => {
    const matchingOmnyEpisode = omnyStudioEpisodes.Clips.filter(episode => {
        if (megaphoneEpisode.title.includes(episode.Title) && episode.Monetization.MidRolls.length === 0) {
            return true;
        } else {
            return false;
        }
    });
    if (matchingOmnyEpisode.length > 0) {
        matchedEpisodes.push({ megaphoneEpisode: megaphoneEpisode, omnyEpisode: matchingOmnyEpisode[0] });
    } else {
        unmatchedEpisodes.push(megaphoneEpisode);
    }
});

console.log({ matchedEpisodesLength: matchedEpisodes.length });
console.log({ unmatchedEpisodesLength: unmatchedEpisodes.length });

// Perform a put request

const updateOmnyEpisodeWithMidrolls = (clipId, midrolls, title) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log({ clipId, midrolls, title });
            omnyStudioManagementApi.post({
                url: `https://api.omnystudio.com/v0/clips/${clipId}`,
                body: {
                    "Monetization": {
                      "MidRolls": midrolls
                    }
                },
                json: true
            }, (err, response, body) => {
                if (err) {
                    reject(err);
                    console.warn(err);
                    return;
                }
                console.log(body);
                resolve(body);
            });
        }, 2000);
    });
}

const uniqueMidrolls = (midrolls) => {
    if (midrolls) {
        return [...new Set(midrolls)];
    } else {
        return [];
    }
}

// Transform the midrolls from seconds to HH:MM:SS
const transformMidrolls = (midrollArray) => {
    const transformedMidrolls = midrollArray.map((insertionPoint) => {
        return new Date(insertionPoint * 1000).toISOString().substr(11, 8);
    });

    return uniqueMidrolls(transformedMidrolls);
}

const testEpisodeList = matchedEpisodes;

const promises = testEpisodeList.map((episode) => {
    const midrolls = episode.megaphoneEpisode.insertionPoints;
    const transformedMidrolls = transformMidrolls(midrolls);
    const clipId = episode.omnyEpisode.Id;
    const title = episode.omnyEpisode.Title;

    return updateOmnyEpisodeWithMidrolls.bind(this, clipId, transformedMidrolls, title);
});

promiseSerial(promises);