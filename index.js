const request = require('request');
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

const getMegaphoneMidrolls = (title) => {
    return new Promise((resolve, reject) => {
        megaphoneApi.get(MEGAPHONE_API_PODCAST_URL, (err, response, body) => {
            if (err) {
                console.warn(err);
                reject(err);
                return;
            }

            const episodes = JSON.parse(body);
            const episode = episodes.filter(episode => episode.title.includes(title))[0];
            resolve(episode.insertionPoints);
        });
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

const updateOmnyEpisodeWithMidrolls = (clipId, midrolls) => {
    return new Promise((resolve, reject) => {
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
    });
}

// Get an episode list from omny studio and find the first episode that is missing midrolls
omnyStudioManagementApi.get(OMNYSTUDIO_MANAGEMENT_API_PODCAST_URL, async (err, response, body) => {
    if (err) {
        console.warn(err);
        return;
    }

    const parsedBody = JSON.parse(body);

    let index = 0;
    let clip;
    while (parsedBody.Clips[index] && !clip) {
        if (parsedBody.Clips[index].Monetization.MidRolls.length === 0) {
            clip = parsedBody.Clips[index];
            console.log('Found the first appearance of a flip without midroll');
            console.log({ clip: clip.Title });
            console.log({ MidRolls: parsedBody.Clips[index].Monetization.MidRolls });
            // Find the equivalent episode in megaphone and check if it has a midroll
            const midrolls = await getMegaphoneMidrolls(clip.Title);
            const transformedMidrolls = transformMidrolls(midrolls);
            console.log({ transformedMidrolls });
            updateOmnyEpisodeWithMidrolls(clip.Id, transformedMidrolls);
        } else {
            index++;
        }
    }
});
