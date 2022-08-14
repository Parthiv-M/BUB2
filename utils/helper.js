/* Helper functions to modularize the code */
const fetch = require("isomorphic-fetch");
const rp = require("request-promise");

module.exports = {
  checkForDuplicatesFromIA: async (ID) => {
    return fetch(
      `https://archive.org/advancedsearch.php?q=${ID}&fl[]=identifier&output=json`
    )
      .then(
        (res) => res.json(),
        (err) => console.log(err)
      )
      .catch((err) => console.log(err));
  },

  customFetch: async (URI, method = "GET", headers = new Headers()) => {
    return fetch(URI, {
      method: method,
      headers: headers,
    })
      .then(
        (res) => res.json(),
        (err) => console.log(err)
      )
      .catch((err) => console.log(err));
  },

  queueData: async (job, queue) => {
    if (!job) return null;
    const jobid = job.id;
    const { logs } = await queue.getJobLogs(jobid, 0);
    if (logs[0]) return JSON.parse(logs[0]);
    else return [];
  },

  statusConfig: (processedOn, sum) => {
    return {
      [sum]: "Completed",
      [processedOn]: "Active",
      0: "In Queue",
    };
  },

  bookTitle: {
    gb: "volumeInfo.title",
    pdl: "title",
  },

  getPreviewLink: (queue_name, book_id, category_id = null) => {
    const previewLinks = {
      gb: `http://books.google.co.in/books?id=${book_id}&hl=&source=gbs_api`,
      pdl: `http://www.panjabdigilib.org/webuser/searches/displayPage.jsp?ID=${book_id}&page=1&CategoryID=${category_id}&Searched=W3GX`,
    };
    return previewLinks[queue_name];
  },

  getMetaData: async (cheerioOptions, bookid, categoryID) => {
    const $ = await rp(cheerioOptions);
    let PNdetails = {};
    const keys = $(".ubhypers");
    const values = $(".dhypers");

    function addOtherMetaData(limit, keys, values, PNdetails) {
      let value;
      for (let i = 0; i < values.length; i++) {
        if ($(values[i]).attr("href")) {
          if (!$(values[i]).attr("href").includes("Keywords")) {
            value = i;
            break;
          }
        }
      }

      if (value <= limit) {
        const add = limit - value;
        for (let i = value; i < values.length; i++) {
          PNdetails[[$(keys[i + add]).text()]] = $(values[i]).text().trim();
        }
      } else {
        const sub = value - limit;
        for (let i = value; i < values.length; i++) {
          PNdetails[[$(keys[i - sub]).text()]] = $(values[i]).text().trim();
        }
      }
    }

    if ($(values[0]).text().trim() === "Click here to add description") {
      if ($(values[1]).text().trim() === "Click here to suggest keywords") {
        for (let i = 2; i < values.length; i++) {
          PNdetails[[$(keys[i + 1]).text()]] = $(values[i]).text().trim();
        }
      } else {
        addOtherMetaData(4, keys, values, PNdetails);
      }
    } else if (
      $(values[0]).text().trim() === "Click here to suggest keywords"
    ) {
      for (let i = 1; i < values.length; i++) {
        PNdetails[[$(keys[i + 2]).text()]] = $(values[i]).text().trim();
      }
      PNdetails.description = $(
        "#Nanakshahi > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > table:nth-child(22) > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2)"
      )
        .text()
        .trim();
    } else {
      addOtherMetaData(5, keys, values, PNdetails);
      PNdetails.description = $(
        "#Nanakshahi > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > table:nth-child(22) > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2)"
      )
        .text()
        .trim();
      PNdetails.description = PNdetails.description.replace(/\n/g, "");
      PNdetails.description = PNdetails.description.replace(/\[edit]/g, "");
    }

    PNdetails.title = $(
      "#Nanakshahi > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > table:nth-child(22) > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(1) > td > a"
    )
      .text()
      .trim();
    PNdetails.bookID = bookid;
    PNdetails.categoryID = categoryID;
    let src = $(
      "#Nanakshahi > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > table:nth-child(22) > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > a > img"
    ).attr("src");
    src = src.match(/pdl.*/gm);
    PNdetails.coverImage = `http://panjabdigilib.org/${src}`;

    delete PNdetails[""];

    return PNdetails;
  },
};
