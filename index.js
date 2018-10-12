const path = require('path')
require('dotenv').config({path: path.resolve(process.cwd(), '_env')})
const ghGot = require('gh-got')

/*
  how this is going to work ...
    1. GET file from suggestion branch
       https://developer.github.com/v3/repos/contents/#get-contents
    2. read file content from response
    3. add line to file
    4. update remote file content via PUT
       https://developer.github.com/v3/repos/contents/#update-a-file
    5. create a pull request via POST
       https://developer.github.com/v3/pulls/#create-a-pull-request
*/
const baseUrl = 'repos/jfix/production/'
const updateBody = {
  message: 'Add another funny line',
  committer: {
    name: 'Abot Somewhere',
    email: 'abot@somewhere.com'
  },
  author: {
    name: 'The author',
    email: 'author@somewhere.else'
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
