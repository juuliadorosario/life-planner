#[cfg(target_os = "macos")]
mod calendar;
#[cfg(target_os = "macos")]
mod reminders;
mod spotify;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_sql::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      spotify::spotify_state,
      spotify::spotify_command,
      calendar::calendar_status,
      calendar::calendar_request_access,
      calendar::calendar_list,
      calendar::calendar_events,
      calendar::calendar_create_event,
      reminders::reminders_status,
      reminders::reminders_request_access,
      reminders::reminders_list,
      reminders::reminders_set_completed,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
