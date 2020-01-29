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
    const matchingOmnyEpisode = omnyStudioEpisodes.Clips.filter(episode => megaphoneEpisode.title.includes(episode.Title));
    if (matchingOmnyEpisode.length > 0) {
        matchedEpisodes.push(megaphoneEpisode);
    } else {
        unmatchedEpisodes.push(megaphoneEpisode);
    }
});

console.log({ matchedEpisodesLength: matchedEpisodes.length });
console.log({ unmatchedEpisodesLength: unmatchedEpisodes.length });

// Perform a put request
