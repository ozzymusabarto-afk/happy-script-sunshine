<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render visitor-local clock values through `useLocalNow` after hydration; SSR cannot know the visitor timezone and must use a neutral placeholder.
- Reuse `SimulationNotice` beside investment projections so assumptions and educational limitations remain consistent.
- Keep primary navigation in AppShell and put secondary destinations in its shared More menu so desktop and mobile offer the same pages.
