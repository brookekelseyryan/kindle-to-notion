# 📘 Kindle to Notion ~ Pretty Sync 💖
### Seamlessly transfer your Kindle highlights to a Notion Database, in Readwise formatting style & with high-quality book covers! 
✨ Kindle Pretty Sync [Notion template](https://brookekelseyryan.notion.site/brookekelseyryan/Kindle-Highlights-0897433cd50649d3a15e4817e486a48b)

🍴 _a fork of [kindle-to-notion](https://github.com/arkalim/kindle-to-notion)_

# 🔁 Usage
> Before you can run the sync, you need to complete the setup section.

First, [create a new GitHub repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository). 

To sync your highlights, just upload the new ```My Clippings.txt``` file into your GitHub repo. It will trigger a GitHub Action to sync the newly added highlights to your Notion books database.

# ⚙️ Setup

- Duplicate my [Notion books database](https://brookekelseyryan.notion.site/brookekelseyryan/Kindle-Highlights-0897433cd50649d3a15e4817e486a48b) as a template in your Notion account. You don't need to clone the contents of the database. You only need to database table. This will serve as your Notion books database.

- Create a new **internal integration** at https://www.notion.so/my-integrations and copy the **Notion API key**.
![](/images/book-highlights-integration.png)

- Go to your Notion dashboard. Open your books database as a page. Click on the three dots icon (more options) and go to **Add connection**. Search for the integration you created in the previous step and add it as a connection.
![](/images/adding-integration-to-database.png)

- On the Notion books database page, go to **Share** and click on **Copy link** to get the URL of the Notion database.
![](/images/getting-db-link.png)

- Now, extract the Database Id from the link as shown in the example below:
  ```
  Book Database Link: https://www.notion.so/arkalim/346be84507ff482b80fceb4024deadc2?v=e868075eaf5749bc941e617e651295fb
  Book Database Id: 346be84507ff482b80fceb4024deadc2
  ```
- Connect your **Kindle** E-Reader to your computer. Navigate to `Kindle` ➡ `documents` and copy `My Clippings.txt`. 

- Create a GitHub repository and add your `My Clippings.txt` to the root of the repository. Now, add a file `sync.yaml` to the repository at location `.github/workflows` with the following content:
  ```
  name: Sync Kindle Highlights
  on: [push, workflow_dispatch]
  jobs:
    sync-highlights:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout repository
          uses: actions/checkout@v3

        - name: Sync highlights
          uses: addnab/docker-run-action@v3
          with:
            image: ghcr.io/brookekelseyryan/kindle-to-notion-pretty-sync:master
            run: node /code/dist/main.js
            options: |
              -v ${{ github.workspace }}:/code/resources 
              -e BOOK_DB_ID=${{ vars.BOOK_DB_ID }}
              -e NOTION_API_KEY=${{ secrets.NOTION_API_KEY }}

        - name: Commit cache changes
          uses: EndBug/add-and-commit@v7
          with:
            message: Commit cache changes
            add: sync.json

        - name: Push cache changes
          uses: ad-m/github-push-action@master
          with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
  ```

- The above step will trigger a GitHub action to sync the highlights. But, it will fail as you haven't yet setup the `NOTION_API_KEY` and the `BOOK_DB_ID`. To do that, go to the GitHub repository settings, click on *Secrets and Variables* and then click on *Actions*. Now, create a secret by the name `NOTION_API_KEY` and a variable by the name `BOOK_DB_ID`, with their corresponding values as obtained in the previous steps.
![](/images/configuring-secrets.png)

- Now, you need to allow GitHub Action to save the cache (make updates) to the repository. For that, go to repository settings. Click on *Actions* and then on *General*. Scroll down to *Workflow permissions* and select *Read and write permissions*.
![](/images/workflow-permissions.png)

- You can now manually trigger the GitHub Action by going to the Actions tab in the GitHub repo. This will sync the highlights for the first time and create a `sync.json` file (cache) in the repository. Afterwards, whenever you want to sync your highlights, just upload the new `My Clippings.txt` file into your GitHub repo. It will automatically trigger the action to sync the newly added highlights.

> For reference on how to setup your repo, take a look at @arkalim's [Kindle Highlights Repo](https://github.com/arkalim/kindle-highlights) 

# ❗️For Nerds
### unique for this fork: 
- The Google Books API is used to search for a book cover. It searches Google Books for a high-quality (i.e. medium or large size) cover image for the first two entries of the Google Books Search by querying the book title. If no high-quality cover is found, the thumbnail is used. 
   - In rare instances, where no cover is found, the 📘 Emoji is used as the page icon and no cover is set. 
- ```Book Name``` is used as the primary key to facilitate upsert operation in **Notion** database. So, this field should be left untouched. However, the other fields like **Title** and **Author** could be modified as per your wish. Additionally, you can also add more fields if you'd like. 
- The ```Highlights``` field in Notion is currently only set when the page is first made. The number is not updated if additional highlights are appended to the page at a later sync. 
- Notes taken for a highlight on your Kindle are displayed in the same style as Readwise:
This is an example highlight (Location 100-102)
**Note:** This is an example note 

### from original repo: 
- Every highlight made on Kindle is appended at the end of `My Clippings.txt`
- This tool only syncs the new highlights made to each book. If no new highlights have been made, no sync takes place. 
- The info about the last sync is stored in `sync.json` present in your repository containing `My Clippings.txt`.
- In case you wish to sync every book all over again, delete the `sync.json` file from the repo and delete all the highlights present in your **Notion**.
- **GitHub Action** is used for CICD. Whenever a push is made to the master branch, the Docker image is rebuilt and pushed to GitHub container registry.
- Your GitHub repo containing `My Clippings.txt` runs the GitHub action to sync the highlights to Notion everytime you push a change to it. It can also be triggered manually from the *Actions* tab.

# 🏆 Acknowledgements
This repository is a fork of GitHub user [@akralim's](https://github.com/arkalim) [kindle-to-notion](https://github.com/arkalim/kindle-to-notion) repository. None of my work would be possible without theirs---they did a wonderful job with the application, it is well-maintained, the code is very clean, and the majority of the code in this fork remains the same as theirs. However, I fell in love with the format of the [Readwise Notion template](https://alvarocc.notion.site/Readwise-1945090e9a0449608dce0d1058580de4). But alas, being a grad student, I didn't want to have to pay for the monthly subscription. 

So, I made this fork of [kindle-to-notion](https://github.com/arkalim/kindle-to-notion) to be in the same style as the Readwise Notion template. This required using a different starting template, and a surprising amount of code change. So, much of the instructions here are the same as in the original [kindle-to-notion](https://github.com/arkalim/kindle-to-notion) repo, with a few updated sections where its relevant.  
