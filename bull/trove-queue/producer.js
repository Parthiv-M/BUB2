const config = require("../../utils/bullconfig");
const TroveQueue = config.getNewQueue("trove-queue");
const { getTroveMetaData } = require("../../utils/helper.js");
const cheerio = require("cheerio"); // Basically jQuery for node.js

require("./consumer");
module.exports = async (bookid, metaData, email, userName) => {
  const uri = `https://trove.nla.gov.au/newspaper/article/${bookid}`;
  var options = {
    uri,
    transform: function (body) {
      return cheerio.load(body);
    },
  };

  const issueRenditionId = await getTroveMetaData(options);

  metaData["email"] = email;
  metaData["issueRenditionId"] = issueRenditionId;
  metaData["userName"] = userName;
  const details = {
    details: metaData,
  };
  TroveQueue.add(details);
};
