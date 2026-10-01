//! Apple Reminders through EventKit (macOS). Same store as Calendar, but its own
//! permission: macOS asks separately, with the reason from Info.plist.

use serde::Serialize;
use std::sync::mpsc;
use std::time::Duration;

use block2::RcBlock;
use objc2::runtime::Bool;
use objc2_event_kit::{EKEntityType, EKEventStore, EKReminder};
use objc2_foundation::{NSArray, NSCalendar, NSDate, NSDateComponentUndefined, NSError, NSString};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeReminder {
    pub id: String,
    pub title: String,
    /// Milliseconds since the Unix epoch; missing when the reminder has no date.
    pub due: Option<f64>,
    /// Due on a day, without a time.
    pub all_day: bool,
    pub list_title: Option<String>,
    pub list_color: Option<String>,
}

fn describe(r: &EKReminder) -> NativeReminder {
    unsafe {
        let comps = r.dueDateComponents();
        let due = comps.as_ref().and_then(|c| NSCalendar::currentCalendar().dateFromComponents(c));
        let list = r.calendar();
        NativeReminder {
            id: r.calendarItemIdentifier().to_string(),
            title: r.title().to_string(),
            due: due.map(|d| d.timeIntervalSince1970() * 1000.0),
            all_day: comps.as_ref().is_some_and(|c| c.hour() == NSDateComponentUndefined),
            list_title: list.as_ref().map(|c| c.title().to_string()),
            list_color: list.as_ref().and_then(|c| crate::calendar::hex(c.CGColor())),
        }
    }
}

/// `not-determined`, `denied`, `restricted` or `full`.
#[tauri::command]
pub fn reminders_status() -> String {
    let status = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Reminder) };
    crate::calendar::status_name(status).to_string()
}

/// Shows the macOS permission prompt (only the first time) and waits for the answer.
#[tauri::command]
pub async fn reminders_request_access() -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let (tx, rx) = mpsc::channel();
        let store = unsafe { EKEventStore::new() };
        let block = RcBlock::new(move |granted: Bool, _error: *mut NSError| {
            let _ = tx.send(granted.as_bool());
        });
        unsafe { store.requestFullAccessToRemindersWithCompletion(RcBlock::as_ptr(&block)) };
        rx.recv_timeout(Duration::from_secs(300)).map_err(|_| "No answer from the permission dialog".to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Unfinished reminders due between two instants (ms since epoch).
/// Without `start`, everything overdue is included too.
#[tauri::command]
pub async fn reminders_list(start: Option<f64>, end: f64) -> Result<Vec<NativeReminder>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let (tx, rx) = mpsc::channel();
        let store = unsafe { EKEventStore::new() };
        let from = start.map(|s| NSDate::dateWithTimeIntervalSince1970(s / 1000.0));
        let to = NSDate::dateWithTimeIntervalSince1970(end / 1000.0);
        let predicate = unsafe { store.predicateForIncompleteRemindersWithDueDateStarting_ending_calendars(from.as_deref(), Some(&to), None) };
        let block = RcBlock::new(move |found: *mut NSArray<EKReminder>| {
            let list = unsafe { found.as_ref() }.map(|a| a.iter().map(|r| describe(&r)).collect()).unwrap_or_default();
            let _ = tx.send(list);
        });
        unsafe { store.fetchRemindersMatchingPredicate_completion(&predicate, &block) };
        let mut list: Vec<NativeReminder> = rx.recv_timeout(Duration::from_secs(20)).map_err(|_| "Reminders did not answer".to_string())?;
        eprintln!("reminders_list: {} found", list.len());
        list.sort_by(|a, b| a.due.unwrap_or(f64::MAX).total_cmp(&b.due.unwrap_or(f64::MAX)));
        Ok(list)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Ticks a reminder off (or back on) in Apple Reminders.
#[tauri::command]
pub fn reminders_set_completed(id: String, completed: bool) -> Result<(), String> {
    unsafe {
        let store = EKEventStore::new();
        let item = store.calendarItemWithIdentifier(&NSString::from_str(&id)).ok_or("Reminder not found")?;
        let reminder = item.downcast::<EKReminder>().map_err(|_| "Not a reminder")?;
        reminder.setCompleted(completed);
        store
            .saveReminder_commit_error(&reminder, true)
            .map_err(|e| e.localizedDescription().to_string())
    }
}
