const path = require('path')
require('dotenv').config({path: path.resolve(process.cwd(), '_env')})
const ghGot = require('gh-got')

// how this is going to work ...
/*
    1. commit a new change https://developer.github.com/v3/git/#introducing-the-git-database-api
      a. get current file sha with ghGot('repos/jfix/production/contents/test.json', ...)
      b. get commit sha
      c. get tree sha
      --
      b. get blob with ghGot('repos/jfix/production/git/blobs/c9da69b01d4f778097fe400ff5d80c27fd782ca7'
      c. parse blob, add new line to array
      d. commit blob

    2. create a pull request
*/
const baseUrl = 'repos/jfix/production/'
const updateBody = {
  'message': 'Add another funny line',
  'committer': {
    'name': 'Abot Somewhere',
    'email': 'abot@somewhere.com'
  },
  'branch': 'suggestion'
}
const prBody = { 'body': {
  title: 'A great line',
  body: 'Please have a look and approve!',
  head: 'suggestion',
  base: 'master' } }
;
(async () => {
  try {
    const { body } = await ghGot(`${baseUrl}contents/test.json?ref=suggestion`, {token: process.env.GITHUB_TOKEN})
    const fileSha = body.sha
    const content = Buffer.from(body.content, 'base64').toString()
    // remove potential trailing comma so that JSON parser doesn't vomit
    const arr = JSON.parse(content.replace(/,(?!\s*?[{["'\w])/g, ''))
    arr.push(`new line ${arr.length} !!!`)
    await ghGot.put(`${baseUrl}contents/test.json`, {
      body: {
        ...updateBody,
        content: Buffer.from(JSON.stringify(arr, {}, 2) + '\n').toString('base64'),
        sha: fileSha
      }
    })
    await ghGot.post(`${baseUrl}pulls`, prBody)
  } catch (error) {
    console.log(error.response.body)
  }
})()
