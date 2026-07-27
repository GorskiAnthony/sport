# Instructions pour Claude Code

## Branches

- Ne jamais travailler ou commit directement sur `main`. Tout le développement se fait sur `dev` (ou une branche dérivée de `dev`) ; `main` reçoit `dev` via PR/merge, jamais l'inverse.
- S'il faut exceptionnellement faire rattraper `dev` par `main` (hotfix, resynchro), ne jamais faire de `fast-forward` : utiliser un vrai commit de merge (`git merge origin/main --no-ff`). Un fast-forward peut terminer sur un commit `chore(release): ... [skip ci]` généré par semantic-release, et GitHub Actions ignore alors silencieusement tout le push (aucun run déclenché, donc l'image `:dev` n'est jamais reconstruite). Après un tel merge, vérifier quand même que la CI s'est bien déclenchée (`gh run list --branch dev`) et la lancer manuellement (`gh workflow run "Release frontend" --ref dev` / `"Release backend"`) si ce n'est pas le cas.

## Commits

- Ne jamais ajouter de mention de Claude, Anthropic ou d'IA dans les commits (pas de trailer `Co-Authored-By: Claude...`, pas de mention dans le message).
