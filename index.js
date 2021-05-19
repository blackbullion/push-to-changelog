const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs').promises

const main = async () => {
  try {
    const token = core.getInput('token')
    const octokit = github.getOctokit(token)  
    const repo = github.context.repo

    const commitRes = await octokit.rest.git.getCommit({ ...repo, commit_sha: github.context.sha })
    if (!commitRes.data) throw new Error('Commit not found')

    const commit = commitRes.data.message
    const sha = commitRes.data.html_url

    const prefix = core.getInput('prefix') || 'changelog: '
    const filePath = core.getInput('filePath')

    if (commit.toLowerCase().startsWith(prefix)) {
      let changelogContents = await fs.readFile(filePath, 'utf8')
      const unreleasedHeader = '## Unreleased'

      if (!changelogContents.split('\n').find((l) => l.startsWith(unreleasedHeader))) {
        // add in the unreleased header
        changelogContents = `${unreleasedHeader}\n${changelogContents}`
      }

      // append commit under unreleased header
      changelogContents = changelogContents.replace(
        unreleasedHeader,
        `${unreleasedHeader}\n- ${commit.replace(prefix, '')} ([commit](${sha}))`
      )

      await fs.writeFile(filePath, changelogContents)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()
