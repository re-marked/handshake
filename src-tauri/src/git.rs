//! git-time-machine — each network (vault) is a git repo; snapshots are commits, restore is a
//! checkout. libgit2 is vendored (no system git needed; users never configure git). Pure local
//! repo ops only (no remotes) — that's why git2 ships with default features (ssh/https) off.

use std::path::{Path, PathBuf};

use serde::Serialize;

const TM_NAME: &str = "Handshake Time Machine";
const TM_EMAIL: &str = "time-machine@handshake.app";
const DATA_DIRS: [&str; 5] = ["people", "handshakes", "goals", "interactions", "attachments"];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TmStatus {
    pub is_repo: bool,
    pub dirty: bool,
    pub head_id: Option<String>,
}

#[derive(Serialize)]
pub struct Snapshot {
    pub id: String,
    pub time: i64, // unix seconds
    pub message: String,
    pub files: usize,
    pub insertions: usize,
    pub deletions: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TmSize {
    pub data_bytes: u64,
    pub git_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TmStats {
    pub snapshots: usize,
    pub first_time: i64, // unix seconds of the oldest commit (0 if none)
    pub last_time: i64,
    pub active_days: usize, // distinct calendar days with a snapshot
    pub added_bytes: u64,   // total bytes of added lines across all snapshots — "content written"
    pub data_bytes: u64,
    pub git_bytes: u64,
}

/// Make the vault a git repo if it isn't one: write `.gitignore` (excludes the volatile
/// `.handshake/` sidecar), set a repo-local identity (never touches global git config), and
/// ensure HEAD exists (an initial snapshot) so later snapshots always have a parent. Idempotent.
#[tauri::command]
pub fn tm_init(vault: String) -> Result<(), String> {
    let root = PathBuf::from(&vault);
    let repo = match git2::Repository::open(&root) {
        Ok(repo) => repo,
        Err(_) => git2::Repository::init(&root).map_err(|e| e.to_string())?,
    };
    write_gitignore(&root)?;
    if let Ok(mut cfg) = repo.config() {
        let _ = cfg.set_str("user.name", TM_NAME);
        let _ = cfg.set_str("user.email", TM_EMAIL);
    }
    if repo.head().is_err() {
        commit_all(&repo, "Initial snapshot")?; // create the root commit so HEAD is born
    }
    Ok(())
}

/// Snapshot the vault: stage every tracked change (adds, edits, deletions; `.handshake/` is
/// ignored) and commit. Returns the new commit id, or `None` when nothing changed.
#[tauri::command]
pub fn tm_snapshot(vault: String, message: String) -> Result<Option<String>, String> {
    let repo = git2::Repository::open(PathBuf::from(&vault)).map_err(|e| e.to_string())?;
    commit_all(&repo, &message)
}

/// Newest-first snapshot history with per-commit change stats (files / insertions / deletions).
#[tauri::command]
pub fn tm_log(vault: String, limit: usize) -> Result<Vec<Snapshot>, String> {
    let repo = git2::Repository::open(PathBuf::from(&vault)).map_err(|e| e.to_string())?;
    let mut walk = repo.revwalk().map_err(|e| e.to_string())?;
    if walk.push_head().is_err() {
        return Ok(Vec::new()); // unborn HEAD → no history yet
    }
    walk.set_sorting(git2::Sort::TIME).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for oid in walk.take(limit) {
        let oid = oid.map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
        let tree = commit.tree().map_err(|e| e.to_string())?;
        let parent_tree = commit.parent(0).ok().and_then(|p| p.tree().ok());
        let diff = repo
            .diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)
            .map_err(|e| e.to_string())?;
        let stats = diff.stats().map_err(|e| e.to_string())?;
        out.push(Snapshot {
            id: oid.to_string(),
            time: commit.time().seconds(),
            message: commit.message().unwrap_or("").trim().to_string(),
            files: stats.files_changed(),
            insertions: stats.insertions(),
            deletions: stats.deletions(),
        });
    }
    Ok(out)
}

/// Rewrite the working tree to match a snapshot — files only; HEAD stays put (the frontend wraps
/// this with a snapshot-before / snapshot-after so the move is itself recorded and reversible).
/// `.handshake/` is ignored, so board layout / settings are untouched.
#[tauri::command]
pub fn tm_restore(vault: String, commit_id: String) -> Result<(), String> {
    let repo = git2::Repository::open(PathBuf::from(&vault)).map_err(|e| e.to_string())?;
    let commit = repo
        .revparse_single(&commit_id)
        .map_err(|e| e.to_string())?
        .peel_to_commit()
        .map_err(|e| e.to_string())?;
    let tree = commit.tree().map_err(|e| e.to_string())?;
    let mut cb = git2::build::CheckoutBuilder::new();
    cb.force().remove_untracked(true); // revert tracked files + drop files added since; keep ignored
    repo.checkout_tree(tree.as_object(), Some(&mut cb)).map_err(|e| e.to_string())?;
    Ok(())
}

/// Repo state for a vault: is it a repo, are there uncommitted changes, and the current HEAD id.
#[tauri::command]
pub fn tm_status(vault: String) -> Result<TmStatus, String> {
    let root = PathBuf::from(&vault);
    let repo = match git2::Repository::open(&root) {
        Ok(repo) => repo,
        Err(_) => return Ok(TmStatus { is_repo: false, dirty: false, head_id: None }),
    };
    let head_id = repo
        .head()
        .ok()
        .and_then(|h| h.peel_to_commit().ok())
        .map(|c| c.id().to_string());
    let mut opts = git2::StatusOptions::new();
    opts.include_untracked(true).include_ignored(false).recurse_untracked_dirs(true);
    let dirty = !repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?.is_empty();
    Ok(TmStatus { is_repo: true, dirty, head_id })
}

/// Bytes of network data (the entity folders + attachments) vs. bytes of `.git` history.
#[tauri::command]
pub fn tm_size(vault: String) -> Result<TmSize, String> {
    let root = PathBuf::from(&vault);
    let data_bytes = DATA_DIRS.iter().map(|d| dir_size(&root.join(d))).sum();
    let git_bytes = dir_size(&root.join(".git"));
    Ok(TmSize { data_bytes, git_bytes })
}

/// Aggregate the whole history for growth estimates: how much content was written (added line
/// bytes summed across every snapshot's diff), over how many active days, plus current sizes.
#[tauri::command]
pub fn tm_stats(vault: String) -> Result<TmStats, String> {
    let root = PathBuf::from(&vault);
    let data_bytes = DATA_DIRS.iter().map(|d| dir_size(&root.join(d))).sum();
    let git_bytes = dir_size(&root.join(".git"));
    let empty = TmStats { snapshots: 0, first_time: 0, last_time: 0, active_days: 0, added_bytes: 0, data_bytes, git_bytes };

    let repo = match git2::Repository::open(&root) {
        Ok(repo) => repo,
        Err(_) => return Ok(empty),
    };
    let mut walk = repo.revwalk().map_err(|e| e.to_string())?;
    if walk.push_head().is_err() {
        return Ok(empty);
    }

    let mut snapshots = 0usize;
    let mut first_time = i64::MAX;
    let mut last_time = 0i64;
    let mut added_bytes = 0u64;
    let mut days = std::collections::HashSet::new();
    for oid in walk {
        let commit = repo.find_commit(oid.map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
        snapshots += 1;
        let t = commit.time().seconds();
        first_time = first_time.min(t);
        last_time = last_time.max(t);
        days.insert(t.div_euclid(86_400)); // bucket by UTC day

        let tree = commit.tree().map_err(|e| e.to_string())?;
        let parent_tree = commit.parent(0).ok().and_then(|p| p.tree().ok());
        let diff = repo
            .diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)
            .map_err(|e| e.to_string())?;
        let mut file_cb = |_d: git2::DiffDelta, _p: f32| true;
        diff.foreach(
            &mut file_cb,
            None,
            None,
            Some(&mut |_d, _h, line: git2::DiffLine| {
                if line.origin() == '+' {
                    added_bytes += line.content().len() as u64;
                }
                true
            }),
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(TmStats {
        snapshots,
        first_time: if first_time == i64::MAX { 0 } else { first_time },
        last_time,
        active_days: days.len(),
        added_bytes,
        data_bytes,
        git_bytes,
    })
}

// ── helpers ──────────────────────────────────────────────────────────────────

/// Stage everything (respecting `.gitignore`) and commit. Returns None if the tree is unchanged.
fn commit_all(repo: &git2::Repository, message: &str) -> Result<Option<String>, String> {
    let mut index = repo.index().map_err(|e| e.to_string())?;
    index
        .add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| e.to_string())?;
    index.update_all(["*"].iter(), None).map_err(|e| e.to_string())?; // catch deletions of tracked files
    index.write().map_err(|e| e.to_string())?;
    let tree_oid = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_oid).map_err(|e| e.to_string())?;
    let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    if let Some(ref p) = parent {
        if p.tree_id() == tree_oid {
            return Ok(None); // nothing changed since the last snapshot
        }
    }
    let sig = git2::Signature::now(TM_NAME, TM_EMAIL).map_err(|e| e.to_string())?;
    let parents: Vec<&git2::Commit> = parent.iter().collect();
    let oid = repo
        .commit(Some("HEAD"), &sig, &sig, message, &tree, &parents)
        .map_err(|e| e.to_string())?;
    Ok(Some(oid.to_string()))
}

/// Ensure our required ignore patterns are present WITHOUT clobbering the user's `.gitignore`:
/// only the missing patterns are appended (existing entries + ordering are preserved).
/// `.handshake/` is volatile UI state (board layout, workspace, settings) — never versioned.
fn write_gitignore(root: &Path) -> Result<(), String> {
    const REQUIRED: [&str; 6] = [".handshake/", "*.tmp", ".*.tmp", ".DS_Store", "Thumbs.db", "desktop.ini"];
    let path = root.join(".gitignore");
    let existing = std::fs::read_to_string(&path).unwrap_or_default();
    let present: std::collections::HashSet<&str> = existing.lines().map(str::trim).collect();
    let missing: Vec<&str> = REQUIRED.iter().copied().filter(|p| !present.contains(p)).collect();
    if missing.is_empty() {
        return Ok(()); // already covered — leave the user's file exactly as it is
    }
    let mut body = existing.clone();
    if !body.is_empty() && !body.ends_with('\n') {
        body.push('\n');
    }
    if !existing.trim().is_empty() {
        body.push_str("\n# Handshake (Time Machine) — keep volatile + OS files out of snapshots\n");
    }
    for pattern in missing {
        body.push_str(pattern);
        body.push('\n');
    }
    std::fs::write(&path, body).map_err(|e| e.to_string())
}

fn dir_size(path: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            match entry.metadata() {
                Ok(meta) if meta.is_dir() => total += dir_size(&entry.path()),
                Ok(meta) => total += meta.len(),
                Err(_) => {}
            }
        }
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("handshake-tm-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("people")).unwrap();
        dir
    }
    fn write(root: &Path, rel: &str, content: &str) {
        let p = root.join(rel);
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(p, content).unwrap();
    }
    fn s(p: &Path) -> String {
        p.to_string_lossy().to_string()
    }

    #[test]
    fn init_creates_repo_gitignore_and_initial_commit() {
        let root = temp("init");
        write(&root, "people/a.md", "---\nid: a\n---\nhi\n");
        tm_init(s(&root)).unwrap();
        assert!(root.join(".git").is_dir());
        assert!(root.join(".gitignore").is_file());
        let st = tm_status(s(&root)).unwrap();
        assert!(st.is_repo && st.head_id.is_some());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn init_preserves_an_existing_gitignore_and_appends_only_whats_missing() {
        let root = temp("ignore");
        fs::write(root.join(".gitignore"), "secrets.txt\n*.log\n.handshake/\n").unwrap();
        tm_init(s(&root)).unwrap();
        let gi = fs::read_to_string(root.join(".gitignore")).unwrap();
        assert!(gi.contains("secrets.txt"), "user entry must survive");
        assert!(gi.contains("*.log"), "user entry must survive");
        assert!(gi.contains(".DS_Store"), "missing required pattern appended");
        // .handshake/ was already present → not duplicated
        assert_eq!(gi.matches(".handshake/").count(), 1);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn snapshot_some_then_none_and_stages_deletions() {
        let root = temp("snap");
        write(&root, "people/a.md", "a1");
        tm_init(s(&root)).unwrap();
        write(&root, "people/a.md", "a2");
        write(&root, "people/b.md", "b1");
        assert!(tm_snapshot(s(&root), "edit".into()).unwrap().is_some());
        assert!(tm_snapshot(s(&root), "noop".into()).unwrap().is_none()); // nothing changed
        fs::remove_file(root.join("people/a.md")).unwrap();
        assert!(tm_snapshot(s(&root), "del".into()).unwrap().is_some()); // deletion is a change
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn log_is_newest_first_with_stats() {
        let root = temp("log");
        write(&root, "people/a.md", "one\n");
        tm_init(s(&root)).unwrap();
        write(&root, "people/a.md", "one\ntwo\n");
        tm_snapshot(s(&root), "second".into()).unwrap();
        let log = tm_log(s(&root), 10).unwrap();
        assert_eq!(log.len(), 2);
        assert_eq!(log[0].message, "second"); // newest first
        assert!(log[0].insertions >= 1);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn restore_round_trips_and_preserves_handshake_sidecar() {
        let root = temp("restore");
        write(&root, "people/a.md", "A");
        tm_init(s(&root)).unwrap();
        let oldest = tm_log(s(&root), 10).unwrap().pop().unwrap().id; // initial snapshot = state A
        // mutate: edit a, add c, and write an (ignored) sidecar
        write(&root, "people/a.md", "A-edited");
        write(&root, "people/c.md", "C");
        write(&root, ".handshake/layout.json", "{\"x\":1}");
        tm_snapshot(s(&root), "mutate".into()).unwrap();
        // go back to state A
        tm_restore(s(&root), oldest).unwrap();
        assert_eq!(fs::read_to_string(root.join("people/a.md")).unwrap(), "A");
        assert!(!root.join("people/c.md").exists(), "a file added later should be removed");
        assert!(root.join(".handshake/layout.json").exists(), "ignored sidecar must survive restore");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn stats_aggregate_written_content_and_active_days() {
        let root = temp("stats");
        write(&root, "people/a.md", "first line\n");
        tm_init(s(&root)).unwrap();
        write(&root, "people/a.md", "first line\nsecond line\n");
        tm_snapshot(s(&root), "more".into()).unwrap();
        let st = tm_stats(s(&root)).unwrap();
        assert_eq!(st.snapshots, 2);
        assert!(st.added_bytes >= "first line\nsecond line\n".len() as u64);
        assert!(st.active_days >= 1);
        assert!(st.git_bytes > 0);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn size_reports_data_and_git_bytes() {
        let root = temp("size");
        write(&root, "people/a.md", "hello world");
        tm_init(s(&root)).unwrap();
        let sz = tm_size(s(&root)).unwrap();
        assert!(sz.data_bytes >= 11);
        assert!(sz.git_bytes > 0);
        let _ = fs::remove_dir_all(&root);
    }
}
