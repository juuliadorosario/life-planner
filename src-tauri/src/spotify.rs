//! Talks to the Spotify desktop app through AppleScript (macOS only).
//! No account, token or Premium needed: it reads what the local app is
//! playing and sends play/pause/next/previous. macOS asks once for permission
//! ("LifeOS wants to control Spotify").

use serde::Serialize;
use std::process::Command;

/// Field separator in the AppleScript reply (ASCII unit separator).
const SEP: char = '\u{1f}';

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpotifyState {
    /// `not-running`, `stopped`, `playing` or `paused`.
    pub status: String,
    pub track_id: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_ms: Option<u64>,
    pub progress_ms: Option<u64>,
    pub artwork_url: Option<String>,
}

fn osascript(script: &str) -> Result<String, String> {
    let out = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

#[tauri::command]
pub fn spotify_state() -> Result<SpotifyState, String> {
    // Checking `is running` first means we never launch Spotify by accident.
    let script = r#"
if application "Spotify" is running then
  tell application "Spotify"
    set s to player state as string
    if s is "stopped" then return "stopped"
    set t to current track
    set sep to ASCII character 31
    return s & sep & (id of t) & sep & (name of t) & sep & (artist of t) & sep & (album of t) & sep & (duration of t) & sep & ((player position * 1000) as integer) & sep & (artwork url of t)
  end tell
else
  return "not-running"
end if
"#;
    let reply = osascript(script)?;
    let parts: Vec<&str> = reply.split(SEP).collect();
    if parts.len() < 8 {
        return Ok(SpotifyState {
            status: reply,
            track_id: None,
            title: None,
            artist: None,
            album: None,
            duration_ms: None,
            progress_ms: None,
            artwork_url: None,
        });
    }
    let text = |i: usize| Some(parts[i].to_string()).filter(|s| !s.is_empty());
    Ok(SpotifyState {
        status: parts[0].to_string(),
        track_id: text(1),
        title: text(2),
        artist: text(3),
        album: text(4),
        duration_ms: parts[5].trim().parse().ok(),
        progress_ms: parts[6].trim().parse().ok(),
        artwork_url: text(7),
    })
}

#[tauri::command]
pub fn spotify_command(action: String) -> Result<(), String> {
    let verb = match action.as_str() {
        "play" => "play",
        "pause" => "pause",
        "next" => "next track",
        "previous" => "previous track",
        other => return Err(format!("unknown action: {other}")),
    };
    osascript(&format!(
        "if application \"Spotify\" is running then tell application \"Spotify\" to {verb}"
    ))
    .map(|_| ())
}
