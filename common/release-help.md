--------------------------------------------------------------------------------
- Release/Publish help
--------------------------------------------------------------------------------
1. Update changelog for each project 'rush change' and follow steps.
2. Version projects with 'rush version --bump' or 'rush version --bump --override-bump patch'
3. Build everything with 'rush build'
4. Commit updates 'git commit'
5. Dry run the publish  'rush publish --version-policy default-policy --include-all'
6. Actually run the publish 'rush publish --version-policy default-policy --include-all --publish'


**Example:**

```console
git commit -m 'ready to start a release'
rush change
rush version --bump --override-bump minor
rush build
git add **/package.json common/ rush.json # other appropriate files
git commit -m 'Versioned and ready to release'
rush publish --version-policy default-policy --include-all
rush publish --version-policy default-policy --include-all --publish
git status
git tag version.number
git push --tags
```
