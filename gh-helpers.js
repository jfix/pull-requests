const ghGot = require('gh-got')

/*
  This module exposes currently three functions:
    getFile
    putJsonFile
    createPullRequest
    createBranch
    deleteBranch

  They correspond to the following workflow:
  
    1.  GET file from suggestion branch
        https://developer.github.com/v3/repos/contents/#get-contents
    2.  read file content from response
    3.  change the file
    4.  update remote file content via PUT
        https://developer.github.com/v3/repos/contents/#update-a-file
    5.  create a pull request via POST
        https://developer.github.com/v3/pulls/#create-a-pull-request
*/

/* get a file from a GitHub repository */
const getFile = async (args) => {
  const { owner, repository, branch, filePath } = args
  try {
    const { body } = await ghGot(`repos/${owner}/${repository}/contents/${filePath}?ref=${branch}`)
    const fileSha = body.sha
    const content = Buffer.from(body.content, 'base64').toString()
    // remove potential trailing comma so that JSON parser doesn't vomit
    const json = JSON.parse(content.replace(/,(?!\s*?[{["'\w])/g, ''))
    return {
      json,
      fileSha
    }
  } catch (error) {
    console.log(`getFile: ${error} occurred.`)
  }
}

/* commit a file to a GitHub repository */
const putJsonFile = async (args) => {
  const { owner, repository, filePath, fileSha: sha, jsonFileContents, commitInfo } = args
  const content = Buffer.from(JSON.stringify(jsonFileContents, {}, 2) + '\n').toString('base64')

  try {
    await ghGot.put(`repos/${owner}/${repository}/contents/${filePath}`, {
      body: {
        ...commitInfo,
        content,
        sha
      }
    })
  } catch(error) {
    console.log(`putJsonFile: ${error} occurred.`)
  }
}

/* create a pull request for a given repository */
const createPullRequest = async (args) => {
  const { owner, repository, pullRequestBody } = args
  try {
    await ghGot.post(`repos/${owner}/${repository}/pulls`, { body: pullRequestBody})
  } catch (error) {
    const info = error.response.body.errors[0].message
    console.error(`createPullRequest: ${info}`)
  }
}

const createBranch = async (args) => {
  const { owner, repository, branch } = args
  try {
    await deleteBranch(args)

    const masterSha = await getBranchSha({...args, branch: 'master'})

    const { statusCode } = await ghGot.post(`repos/${owner}/${repository}/git/refs`, { body: {
        ref: `refs/heads/${branch}`,
        sha: masterSha
      }
    })
    if (statusCode === 201) {
      return true
    }
    throw Error('Branch not created')
  } catch (error) {
    console.error(`createBranch: ${error}`)
  }
}

const deleteBranch = async (args) => {
  const { owner, repository, branch } = args
  try {
    const { statusCode } = await ghGot.delete(`repos/${owner}/${repository}/git/refs/heads/${branch}`)
    if (statusCode === 204) {
      return true
    }
    throw Error('Branch not deleted')
  } catch (error) {
    console.error(`deleteBranch: ${error}`)
  }
}

const getBranchSha = async (args) => {
  const { owner, repository, branch } = args
  try {
    const res = await ghGot(`repos/${owner}/${repository}/git/refs/heads/${branch}`)
    return res.body.object.sha
  } catch (error) {

  }
}
module.exports = { getFile, putJsonFile, createPullRequest, createBranch, deleteBranch }
