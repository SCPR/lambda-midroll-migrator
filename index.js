const request = require('request');
require('dotenv').config();

const MEGAPHONE_API_PODCAST_URL = process.env.MEGAPHONE_API_PODCAST_URL || "";
const MEGAPHONE_API_TOKEN = process.env.MEGAPHONE_API_TOKEN || "";

const megaphone = request.defaults({
    headers: {
        'Authorization': `Token token=${MEGAPHONE_API_TOKEN}`
    }
});

megaphone.get(MEGAPHONE_API_PODCAST_URL, (err, response, body) => {
    if (err) {
        console.warn(err);
        return;
    }

    const episodes = JSON.parse(body);
    console.log({ episodeLength: episodes.length });
});
