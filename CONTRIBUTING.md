# Working on Lexicon together

1. Clone this private repository into your own folder and open it in Codex.
2. Ask Codex to read `AGENTS.md`, `Lexicon_Codex_Project_Brief.md`, and
   `DESIGN_SYSTEM.md` before editing. These files carry the shared context.
3. Follow the README setup. Use your own `.env`; keys and databases are ignored.
4. Agree on a small task before editing. Avoid assigning the same files to both
   people at the same time.
5. Update your local main branch, then create a task branch, for example:

   ```text
   git switch main
   git pull
   git switch -c feature/course-library
   ```

6. Make and test one coherent milestone. Explain the concepts involved; do not
   bypass the learning contract for speed.
7. Commit the work, push your branch, and open a pull request. Explain the change,
   checks performed, and remaining limitations.
8. Have the other collaborator review before merging. Pull the updated main
   branch before starting the next task.

A branch keeps unfinished changes separate. A pull request is the proposed change
and its discussion, allowing both people to review it before it joins main.

The repository contains the source and shared Markdown context. Personal Codex
chat history, API credentials, uploaded lectures and local progress are not
shared by cloning the repository.
