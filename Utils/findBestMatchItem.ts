const stringSimilarity = require("string-similarity");

const findBestMatchItem = (query: string): string => {
    const matches = stringSimilarity.findBestMatch(query, NodeCacheObj.get("itemList") as string[]);

    return matches.bestMatch.target

}

export default findBestMatchItem