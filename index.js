const path = require('path')
require('dotenv').config({path: path.resolve(process.cwd(), '_env')})
const { getFile, putJsonFile, createPullRequest } = require('./gh-helpers')

const config = {
    token: process.env.GITHUB_TOKEN, // -- exposing token via process.env.GITHUB_TOKEN will ghGot automatically apply it
    owner: 'jfix',
    repository: 'production',
    filePath: 'test.json'
};

(async () => {
    const { json, fileSha } = await getFile({...config, branch: 'suggestion'})

    // change JSON before committing it
    json.push(`a random line added. index: ${json.length}`)

    await putJsonFile({
        ...config,
        branch: 'suggestion',
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
            'branch': 'suggestion'
        }
    })

    await createPullRequest({
        ...config,
        pullRequestBody: {
            title: 'A great line',
            body: 'Please have a look and approve!',
            head: 'suggestion',
            base: 'master'   
        }
    })
})()
