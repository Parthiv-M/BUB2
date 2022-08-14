const config = require('../../utils/bullconfig')
const GoogleBooksQueue = config.getNewQueue('google-books-queue')
require('./consumer')
module.exports = async (uri, details, email) => {
    GoogleBooksQueue.add({
        uri,
        details,
        email
    })
}