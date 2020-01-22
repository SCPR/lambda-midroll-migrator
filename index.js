const request = require('request');
require('dotenv').config();

const MEGAPHONE_API_PODCAST_URL = process.env.MEGAPHONE_API_PODCAST_URL || "";
const MEGAPHONE_API_TOKEN = process.env.MEGAPHONE_API_TOKEN || "";
const OMNYSTUDIO_CONSUMER_API_PODCAST_URL = process.env.OMNYSTUDIO_CONSUMER_API_PODCAST_URL || "";
const OMNYSTUDIO_MANAGEMENT_API_TOKEN = process.env.OMNYSTUDIO_MANAGEMENT_API_TOKEN || "";

const megaphoneApi = request.defaults({
    headers: {
        'Authorization': `Token token=${MEGAPHONE_API_TOKEN}`
    }
});

const omnyStudioConsumerApi = request;
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

// Get an episode list from omny studio and find the first episode that is missing midrolls
omnyStudioConsumerApi.get(OMNYSTUDIO_CONSUMER_API_PODCAST_URL, async (err, response, body) => {
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
            // Find the equivalent episode in megaphone and check if it has a midroll
            const midrolls = await getMegaphoneMidrolls(clip.Title);
            console.log({ midrolls });
        } else {
            index++;
        }
    }
});
