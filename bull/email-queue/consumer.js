const config = require("../../utils/bullconfig");
const EmailQueue = config.getNewQueue("email-queue");
const winston = require("winston");
const logger = winston.loggers.get("defaultLogger");
require("dotenv").config();
const { Mwn } = require("mwn");

/* 
Mediawiki Email API DOCS - https://www.mediawiki.org/wiki/API:Emailuser#JavaScript
MWN TOOLFORGE PACKAGE DOCS -https://github.com/siddharthvp/mwn
*/

async function mediawikiEmail(username, title, trueURI, success, done) {
  const bot = await Mwn.init({
    apiUrl: "https://en.wikipedia.org/w/api.php",
    username: process.env.EMAIL_BOT_USERNAME,
    password: process.env.EMAIL_BOT_PASSWORD,
    // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
    userAgent: "bub2.toolforge ([[https://bub2.toolforge.org]])",
    // Set default parameters to be sent to be included in every API request
    defaultParams: {
      assert: "user", // ensure we're logged in
    },
  });
  function getCsrfToken() {
    return bot
      .request({
        action: "query",
        meta: "tokens",
        format: "json",
      })
      .then((data) => {
        send_email(data.query.tokens.csrftoken);
      })
      .catch((error) => {
        console.error("Error while getting CSRF token:", error);
      });
  }

  function send_email(csrf_token) {
    return bot
      .request({
        action: "emailuser",
        target: username,
        subject: "BUB2 upload status",
        text: success
          ? `Your file "${title}" has been uploaded to Internet Archive successfully! Take a look at ${trueURI}`
          : `Your file "${title}" was not uploaded to Internet Archive! Please try again later.
          `,
        token: csrf_token,
        format: "json",
      })
      .then((data) => {
        logger.log({
          level: "info",
          message: `Email Sent Successfully! Result : ${data}`,
        });
        done(null, true);
      })
      .catch((error) => {
        logger.log({
          level: "error",
          message: `Failed to send email with error:  ${error}`,
        });
        done(new Error(error));
      });
  }
  getCsrfToken();
}

EmailQueue.process(async (job, done) => {
  if (job.data.isEmailNotification === "true") {
    mediawikiEmail(
      job.data.userName,
      job.data.title,
      job.data.trueURI,
      job.data.success,
      done
    );
  } else {
    done(null, true);
  }
});
