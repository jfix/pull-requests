const path = require('path')
require('dotenv').config({path: path.resolve(process.cwd(), '_env')})
const { getFile, putJsonFile, createPullRequest, createBranch } = require('./gh-helpers')

// PAYLOAD PREPARATION
const config = {
    token: process.env.GITHUB_TOKEN, // -- exposing token via process.env.GITHUB_TOKEN will ghGot automatically apply it
    owner: process.env.GITHUB_OWNER,
    repository: process.env.GITHUB_REPO,
    filePath: 'assets/js/cent-raisons.js',
    branch: `suggestion-${(new Date()).getTime()}` // create a new branch for each suggestion
};

// ACTUALLY GO AHEAD AND DO STUFF
(async () => {
    await createBranch({...config})
    
    const { json, fileSha } = await getFile({...config})

    // change JSON before committing it
    json.push(`a random line added. index: ${json.length}`)

    await putJsonFile({
        ...config,
        fileSha,
        jsonFileContents: json,
        commitInfo: {
            message: 'Add another funny line',
            committer: {
                name: 'Abot Somewhere',
                email: 'abot@somewhere.com'
            },
            author: {
                name: 'The author',
                email: 'author@somewhere.else'
            },
            'branch': config.branch
        }
    })

    const url = await createPullRequest({
        ...config,
        pullRequestBody: {
            title: 'A great line',
            body: 'Please have a look and approve!',
            head: config.branch,
            base: 'master'   
        }
    })
    console.log(`PR: ${url}`)
})()
