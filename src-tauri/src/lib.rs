use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use notify_debouncer_mini::notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{new_debouncer, DebounceEventResult, Debouncer};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

/// The folders the engine reads and writes. Everything else in the vault
/// (attachments/, .handshake/) is ignored.
const ENTITY_DIRS: [&str; 4] = ["people", "handshakes", "goals", "interactions"];

#[derive(Serialize)]
struct VaultFile {
    relpath: String,
    text: String,
}

/// A change the watcher reports to the frontend. `text` is None for removals.
#[derive(Clone, Serialize)]
struct VaultChange {
    relpath: String,
    kind: String, // "modified" | "removed"
    text: Option<String>,
}

/// The last operation *we* performed on a path, used to suppress watcher echoes.
enum WriteRecord {
    Wrote(u64), // content hash we wrote
    Deleted,
}

/// path -> our last write to it. Lets the watcher tell our echoes from real edits.
type Ledger = Mutex<HashMap<PathBuf, WriteRecord>>;
/// Holds the live watcher so it isn't dropped (which would stop watching).
type WatcherHolder = Mutex<Option<Debouncer<RecommendedWatcher>>>;

// ── commands ─────────────────────────────────────────────────────────────────

/// Read every markdown entity file under the vault as {relpath, text}.
/// A missing entity folder is fine - an empty vault is valid.
#[tauri::command]
fn read_vault(vault: String) -> Result<Vec<VaultFile>, String> {
    read_vault_files(&PathBuf::from(vault))
}

fn read_vault_files(root: &Path) -> Result<Vec<VaultFile>, String> {
    let mut files = Vec::new();
    for dir in ENTITY_DIRS {
        let entries = match fs::read_dir(root.join(dir)) {
            Ok(entries) => entries,
            Err(_) => continue,
        };
        for entry in entries {
            let path = entry.map_err(|e| e.to_string())?.path();
            if path.extension().and_then(|e| e.to_str()) != Some("md") {
                continue;
            }
            let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
                continue;
            };
            let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            files.push(VaultFile { relpath: format!("{dir}/{name}"), text });
        }
    }
    Ok(files)
}

/// Atomically write a vault file (sibling temp file, flush, then rename over it).
#[tauri::command]
fn write_file(vault: String, relpath: String, content: String, ledger: State<'_, Ledger>) -> Result<(), String> {
    let target = safe_join(&vault, &relpath)?;
    // Record our intent BEFORE writing, so the watcher can never see the echo
    // before we've recorded what it should match against.
    ledger.lock().unwrap().insert(target.clone(), WriteRecord::Wrote(hash_bytes(&content)));
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    write_atomic(&target, &content).map_err(|e| e.to_string())
}

/// Delete a vault file. A missing file is success (already gone).
#[tauri::command]
fn delete_file(vault: String, relpath: String, ledger: State<'_, Ledger>) -> Result<(), String> {
    let target = safe_join(&vault, &relpath)?;
    ledger.lock().unwrap().insert(target.clone(), WriteRecord::Deleted);
    match fs::remove_file(&target) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Read an attachment image and return it as a base64 data URL for an <img> tag.
/// Scoped to the vault's attachments/ folder.
#[tauri::command]
fn read_attachment(vault: String, relpath: String) -> Result<String, String> {
    let normalized = relpath.replace('\\', "/");
    if normalized.contains("..") {
        return Err(format!("unsafe relpath: {relpath}"));
    }
    if !normalized.starts_with("attachments/") {
        return Err(format!("not an attachment: {relpath}"));
    }
    let path = PathBuf::from(&vault).join(&normalized);
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let mime = match path.extension().and_then(|e| e.to_str()).map(str::to_ascii_lowercase).as_deref() {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        _ => "application/octet-stream",
    };
    Ok(format!("data:{};base64,{}", mime, STANDARD.encode(bytes)))
}

/// Read the board layout sidecar (.handshake/layout.json). Empty string if absent.
#[tauri::command]
fn read_layout(vault: String) -> Result<String, String> {
    let path = PathBuf::from(&vault).join(".handshake").join("layout.json");
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Atomically write the board layout sidecar. The watcher ignores .handshake/.
#[tauri::command]
fn write_layout(vault: String, content: String) -> Result<(), String> {
    let dir = PathBuf::from(&vault).join(".handshake");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    write_atomic(&dir.join("layout.json"), &content).map_err(|e| e.to_string())
}

/// Read the workspace sidecar (.handshake/workspace.json). Empty string if absent.
#[tauri::command]
fn read_workspace(vault: String) -> Result<String, String> {
    let path = PathBuf::from(&vault).join(".handshake").join("workspace.json");
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Atomically write the workspace sidecar. The watcher ignores .handshake/.
#[tauri::command]
fn write_workspace(vault: String, content: String) -> Result<(), String> {
    let dir = PathBuf::from(&vault).join(".handshake");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    write_atomic(&dir.join("workspace.json"), &content).map_err(|e| e.to_string())
}

/// Copy an external image into the vault's attachments/ folder, named after `name` (+ the
/// source extension). Overwrites an existing same-named file. Returns the vault-relative path.
#[tauri::command]
fn import_attachment(vault: String, src: String, name: String) -> Result<String, String> {
    let src_path = PathBuf::from(&src);
    let ext = src_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let safe: String = name.chars().filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_').collect();
    let safe = if safe.is_empty() { "photo".to_string() } else { safe };
    let rel = format!("attachments/{safe}.{ext}");
    let dir = PathBuf::from(&vault).join("attachments");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::copy(&src_path, PathBuf::from(&vault).join(&rel)).map_err(|e| e.to_string())?;
    Ok(rel)
}

/// Read the per-network settings sidecar (.handshake/settings.json). Empty string if absent.
#[tauri::command]
fn read_settings(vault: String) -> Result<String, String> {
    let path = PathBuf::from(&vault).join(".handshake").join("settings.json");
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Atomically write the per-network settings sidecar. The watcher ignores .handshake/.
#[tauri::command]
fn write_settings(vault: String, content: String) -> Result<(), String> {
    let dir = PathBuf::from(&vault).join(".handshake");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    write_atomic(&dir.join("settings.json"), &content).map_err(|e| e.to_string())
}

/// App-level state (recent vaults / last opened) — lives in the OS app-config dir, NOT in any
/// vault, since it tracks which vaults exist. Empty string if absent.
#[tauri::command]
fn read_app_state(app: AppHandle) -> Result<String, String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?.join("state.json");
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Atomically write the app-level state file in the OS app-config dir.
#[tauri::command]
fn write_app_state(app: AppHandle, content: String) -> Result<(), String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    write_atomic(&dir.join("state.json"), &content).map_err(|e| e.to_string())
}

/// Start watching the vault. External edits are emitted to the frontend as
/// "vault:change"; our own writes are suppressed via the ledger.
#[tauri::command]
fn start_watching(vault: String, app: AppHandle, watchers: State<'_, WatcherHolder>) -> Result<(), String> {
    let root = PathBuf::from(&vault);
    let handler_app = app.clone();
    let handler_root = root.clone();

    let mut debouncer = new_debouncer(Duration::from_millis(400), move |result: DebounceEventResult| {
        let Ok(events) = result else { return };
        let changes: Vec<VaultChange> = {
            let ledger = handler_app.state::<Ledger>();
            let records = ledger.lock().unwrap();
            events
                .iter()
                .filter_map(|event| classify_change(&records, &handler_root, &event.path))
                .collect()
        };
        for change in changes {
            let _ = handler_app.emit("vault:change", change);
        }
    })
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;
    *watchers.lock().unwrap() = Some(debouncer);
    Ok(())
}

// ── pure helpers ─────────────────────────────────────────────────────────────

/// Resolve a vault-relative path safely: must live directly under a known entity
/// folder, with no `..` traversal.
fn safe_join(vault: &str, relpath: &str) -> Result<PathBuf, String> {
    let normalized = relpath.replace('\\', "/");
    if normalized.contains("..") {
        return Err(format!("unsafe relpath: {relpath}"));
    }
    let dir = normalized
        .split_once('/')
        .map(|(dir, _)| dir)
        .ok_or_else(|| format!("relpath must be <folder>/<file>: {relpath}"))?;
    if !ENTITY_DIRS.contains(&dir) {
        return Err(format!("relpath is not in an entity folder: {relpath}"));
    }
    Ok(PathBuf::from(vault).join(normalized))
}

/// Write `content` to `target` atomically. `std::fs::rename` replaces an existing
/// file atomically on Unix and on modern Windows (POSIX rename semantics).
fn write_atomic(target: &Path, content: &str) -> std::io::Result<()> {
    let dir = target.parent().unwrap_or_else(|| Path::new("."));
    let name = target.file_name().and_then(|n| n.to_str()).unwrap_or("entity.md");
    let tmp = dir.join(format!(".{name}.tmp"));
    {
        let mut file = fs::File::create(&tmp)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?; // flush to disk before the swap
    }
    fs::rename(&tmp, target)
}

fn hash_bytes(content: &str) -> u64 {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    content.hash(&mut hasher);
    hasher.finish()
}

/// "/vault/people/sarah-chen.md" -> Some("people/sarah-chen.md"). None for
/// anything that isn't a markdown file directly inside an entity folder (skips
/// attachments/, .handshake/, nested paths, and ".x.md.tmp" sidecars).
fn entity_relpath(root: &Path, path: &Path) -> Option<String> {
    let rel = path.strip_prefix(root).ok()?;
    let mut components = rel.components();
    let dir = components.next()?.as_os_str().to_str()?;
    if !ENTITY_DIRS.contains(&dir) {
        return None;
    }
    if components.count() != 1 {
        return None; // must sit directly under the entity folder
    }
    let name = path.file_name()?.to_str()?;
    if name.starts_with('.') {
        return None; // temp/sidecar file
    }
    if path.extension().and_then(|e| e.to_str()) != Some("md") {
        return None;
    }
    Some(format!("{dir}/{name}"))
}

/// Is this watcher event the echo of something we just did?
fn is_own_echo(record: Option<&WriteRecord>, current_hash: Option<u64>) -> bool {
    match (record, current_hash) {
        (Some(WriteRecord::Wrote(written)), Some(disk)) => *written == disk,
        (Some(WriteRecord::Deleted), None) => true,
        _ => false,
    }
}

/// Turn a changed path into a frontend event, or None if it should be ignored
/// (not an entity file, or an echo of our own write).
fn classify_change(records: &HashMap<PathBuf, WriteRecord>, root: &Path, path: &Path) -> Option<VaultChange> {
    let relpath = entity_relpath(root, path)?;
    let (current_hash, text) = match fs::read_to_string(path) {
        Ok(content) => (Some(hash_bytes(&content)), Some(content)),
        Err(_) => (None, None),
    };
    if is_own_echo(records.get(path), current_hash) {
        return None;
    }
    let kind = if text.is_some() { "modified" } else { "removed" };
    Some(VaultChange { relpath, kind: kind.to_string(), text })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Ledger::default())
        .manage(WatcherHolder::default())
        .invoke_handler(tauri::generate_handler![
            read_vault,
            write_file,
            delete_file,
            start_watching,
            read_attachment,
            import_attachment,
            read_layout,
            write_layout,
            read_workspace,
            write_workspace,
            read_settings,
            write_settings,
            read_app_state,
            write_app_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_own_echo_matches_only_our_own_writes_and_deletes() {
        assert!(is_own_echo(Some(&WriteRecord::Wrote(7)), Some(7))); // wrote this exact content
        assert!(!is_own_echo(Some(&WriteRecord::Wrote(7)), Some(8))); // external edit
        assert!(!is_own_echo(Some(&WriteRecord::Wrote(7)), None)); // externally deleted after our write
        assert!(is_own_echo(Some(&WriteRecord::Deleted), None)); // our own delete
        assert!(!is_own_echo(Some(&WriteRecord::Deleted), Some(7))); // externally recreated
        assert!(!is_own_echo(None, Some(7))); // unknown path -> external
        assert!(!is_own_echo(None, None));
    }

    #[test]
    fn entity_relpath_filters_to_entity_markdown() {
        let root = Path::new("/vault");
        assert_eq!(entity_relpath(root, Path::new("/vault/people/a.md")).as_deref(), Some("people/a.md"));
        assert_eq!(entity_relpath(root, Path::new("/vault/handshakes/a__b.md")).as_deref(), Some("handshakes/a__b.md"));
        assert_eq!(entity_relpath(root, Path::new("/vault/attachments/a.jpg")), None);
        assert_eq!(entity_relpath(root, Path::new("/vault/people/.a.md.tmp")), None);
        assert_eq!(entity_relpath(root, Path::new("/vault/people/a.txt")), None);
        assert_eq!(entity_relpath(root, Path::new("/vault/.handshake/layout.json")), None);
        assert_eq!(entity_relpath(root, Path::new("/vault/people/sub/a.md")), None);
    }

    #[test]
    fn classify_distinguishes_echoes_from_external_edits() {
        let dir = std::env::temp_dir().join("handshake-classify-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("people")).unwrap();
        let path = dir.join("people").join("a.md");

        // our own write: record the hash, write that content -> suppressed
        let content = "---\nid: a\n---\nhi\n";
        fs::write(&path, content).unwrap();
        let mut ledger: HashMap<PathBuf, WriteRecord> = HashMap::new();
        ledger.insert(path.clone(), WriteRecord::Wrote(hash_bytes(content)));
        assert!(classify_change(&ledger, &dir, &path).is_none(), "our own write should be suppressed");

        // external edit: on-disk content no longer matches the recorded hash -> emit
        fs::write(&path, "---\nid: a\n---\nedited externally\n").unwrap();
        let change = classify_change(&ledger, &dir, &path).expect("external edit should emit");
        assert_eq!(change.relpath.as_str(), "people/a.md");
        assert_eq!(change.kind.as_str(), "modified");

        // a temp/sidecar file is ignored entirely
        let tmp = dir.join("people").join(".a.md.tmp");
        fs::write(&tmp, "x").unwrap();
        assert!(classify_change(&ledger, &dir, &tmp).is_none(), "temp files are ignored");

        // a removal we performed -> suppressed
        fs::remove_file(&path).unwrap();
        ledger.insert(path.clone(), WriteRecord::Deleted);
        assert!(classify_change(&ledger, &dir, &path).is_none(), "our own delete should be suppressed");

        let _ = fs::remove_dir_all(&dir);
    }

    // Drives the REAL notify watcher (not Tauri/GUI) over a temp dir: an external
    // edit must surface, our own recorded write must be suppressed.
    #[test]
    fn watcher_reports_external_edits_and_suppresses_our_own() {
        use std::sync::Arc;
        use std::thread::sleep;

        let dir = std::env::temp_dir().join("handshake-watch-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("people")).unwrap();

        let ledger: Arc<Mutex<HashMap<PathBuf, WriteRecord>>> = Arc::new(Mutex::new(HashMap::new()));
        let collected: Arc<Mutex<Vec<VaultChange>>> = Arc::new(Mutex::new(Vec::new()));

        let ledger_in = ledger.clone();
        let collected_in = collected.clone();
        let root = dir.clone();
        let mut debouncer = new_debouncer(Duration::from_millis(80), move |result: DebounceEventResult| {
            let Ok(events) = result else { return };
            let records = ledger_in.lock().unwrap();
            for event in &events {
                if let Some(change) = classify_change(&records, &root, &event.path) {
                    collected_in.lock().unwrap().push(change);
                }
            }
        })
        .unwrap();
        debouncer.watcher().watch(&dir, RecursiveMode::Recursive).unwrap();

        // our own write: record the hash first (as write_file does), then write
        let ours = dir.join("people").join("ours.md");
        let ours_content = "---\nid: ours\n---\nmine\n";
        ledger.lock().unwrap().insert(ours.clone(), WriteRecord::Wrote(hash_bytes(ours_content)));
        fs::write(&ours, ours_content).unwrap();

        // an external edit we never recorded
        fs::write(dir.join("people").join("theirs.md"), "---\nid: theirs\n---\ntheirs\n").unwrap();

        // poll for the external edit (robust against fs + debounce latency)
        let mut saw_external = false;
        for _ in 0..40 {
            if collected.lock().unwrap().iter().any(|c| c.relpath == "people/theirs.md") {
                saw_external = true;
                break;
            }
            sleep(Duration::from_millis(50));
        }
        let changes = collected.lock().unwrap();
        assert!(saw_external, "external edit should be reported by the watcher");
        assert!(
            !changes.iter().any(|c| c.relpath == "people/ours.md"),
            "our own recorded write should be suppressed",
        );

        drop(changes);
        drop(debouncer);
        let _ = fs::remove_dir_all(&dir);
    }
}
