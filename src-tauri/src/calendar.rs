//! Apple Calendar through EventKit (macOS). Reads every calendar the Mac
//! knows about — iCloud, Google, Exchange, subscriptions — and can add events.
//! macOS asks once for permission; the reason shown comes from Info.plist.

use serde::{Deserialize, Serialize};
use std::sync::mpsc;
use std::time::Duration;

use block2::RcBlock;
use objc2::rc::Retained;
use objc2::runtime::Bool;
use objc2_core_graphics::CGColor;
use objc2_event_kit::{EKAuthorizationStatus, EKCalendar, EKEntityType, EKEvent, EKEventStore, EKSpan};
use objc2_foundation::{NSDate, NSError, NSString};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeCalendar {
    pub id: String,
    pub title: String,
    /// `#rrggbb`, as shown in Calendar.app.
    pub color: Option<String>,
    pub writable: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeEvent {
    pub id: String,
    pub title: String,
    /// Milliseconds since the Unix epoch.
    pub start: f64,
    pub end: f64,
    pub all_day: bool,
    pub location: Option<String>,
    pub calendar_id: Option<String>,
    pub calendar_title: Option<String>,
    pub calendar_color: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewEvent {
    pub title: String,
    pub start: f64,
    pub end: f64,
    pub all_day: bool,
    pub location: Option<String>,
    /// Target calendar; the user's default calendar when missing.
    pub calendar_id: Option<String>,
}

fn store() -> Retained<EKEventStore> {
    unsafe { EKEventStore::new() }
}

fn status_name(status: EKAuthorizationStatus) -> &'static str {
    match status {
        EKAuthorizationStatus::NotDetermined => "not-determined",
        EKAuthorizationStatus::Restricted => "restricted",
        EKAuthorizationStatus::Denied => "denied",
        EKAuthorizationStatus::FullAccess => "full",
        EKAuthorizationStatus::WriteOnly => "write-only",
        _ => "unknown",
    }
}

fn hex(color: Option<Retained<CGColor>>) -> Option<String> {
    let color = color?;
    let n = CGColor::number_of_components(Some(&color));
    let ptr = CGColor::components(Some(&color));
    if ptr.is_null() || n < 3 {
        return None;
    }
    let c = unsafe { std::slice::from_raw_parts(ptr, n) };
    let byte = |v: f64| (v.clamp(0.0, 1.0) * 255.0).round() as u8;
    Some(format!("#{:02x}{:02x}{:02x}", byte(c[0] as f64), byte(c[1] as f64), byte(c[2] as f64)))
}

fn describe(cal: &EKCalendar) -> NativeCalendar {
    unsafe {
        NativeCalendar {
            id: cal.calendarIdentifier().to_string(),
            title: cal.title().to_string(),
            color: hex(cal.CGColor()),
            writable: cal.allowsContentModifications(),
        }
    }
}

/// `not-determined`, `denied`, `restricted`, `full` or `write-only`.
#[tauri::command]
pub fn calendar_status() -> String {
    let status = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) };
    status_name(status).to_string()
}

/// Shows the macOS permission prompt (only the first time) and waits for the answer.
#[tauri::command]
pub async fn calendar_request_access() -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let (tx, rx) = mpsc::channel();
        let store = store();
        let block = RcBlock::new(move |granted: Bool, _error: *mut NSError| {
            let _ = tx.send(granted.as_bool());
        });
        unsafe { store.requestFullAccessToEventsWithCompletion(RcBlock::as_ptr(&block)) };
        // Give the user time to read the dialog.
        rx.recv_timeout(Duration::from_secs(300)).map_err(|_| "No answer from the permission dialog".to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn calendar_list() -> Vec<NativeCalendar> {
    let store = store();
    unsafe { store.calendarsForEntityType(EKEntityType::Event) }
        .iter()
        .map(|c| describe(&c))
        .collect()
}

/// Events between two instants (ms since epoch), recurring ones already expanded.
#[tauri::command]
pub async fn calendar_events(start: f64, end: f64) -> Result<Vec<NativeEvent>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = store();
        let from = NSDate::dateWithTimeIntervalSince1970(start / 1000.0);
        let to = NSDate::dateWithTimeIntervalSince1970(end / 1000.0);
        let predicate = unsafe { store.predicateForEventsWithStartDate_endDate_calendars(&from, &to, None) };
        let events = unsafe { store.eventsMatchingPredicate(&predicate) };
        events
            .iter()
            .map(|e| unsafe {
                let calendar = e.calendar();
                NativeEvent {
                    // The same recurring event repeats its identifier, so add the start.
                    id: format!(
                        "{}@{}",
                        e.eventIdentifier().map(|s| s.to_string()).unwrap_or_default(),
                        e.startDate().timeIntervalSince1970() as i64
                    ),
                    title: e.title().to_string(),
                    start: e.startDate().timeIntervalSince1970() * 1000.0,
                    end: e.endDate().timeIntervalSince1970() * 1000.0,
                    all_day: e.isAllDay(),
                    location: e.location().map(|s| s.to_string()).filter(|s| !s.is_empty()),
                    calendar_id: calendar.as_ref().map(|c| c.calendarIdentifier().to_string()),
                    calendar_title: calendar.as_ref().map(|c| c.title().to_string()),
                    calendar_color: calendar.as_ref().and_then(|c| hex(c.CGColor())),
                }
            })
            .collect()
    })
    .await
    .map_err(|e| e.to_string())
}

/// Adds an event to Apple Calendar and returns its identifier.
#[tauri::command]
pub fn calendar_create_event(event: NewEvent) -> Result<String, String> {
    let store = store();
    unsafe {
        let calendar = match &event.calendar_id {
            Some(id) => store.calendarWithIdentifier(&NSString::from_str(id)),
            None => store.defaultCalendarForNewEvents(),
        }
        .ok_or("No calendar to save into")?;
        let ek = EKEvent::eventWithEventStore(&store);
        ek.setTitle(Some(&NSString::from_str(&event.title)));
        ek.setStartDate(Some(&NSDate::dateWithTimeIntervalSince1970(event.start / 1000.0)));
        ek.setEndDate(Some(&NSDate::dateWithTimeIntervalSince1970(event.end / 1000.0)));
        ek.setAllDay(event.all_day);
        if let Some(loc) = &event.location {
            ek.setLocation(Some(&NSString::from_str(loc)));
        }
        ek.setCalendar(Some(&calendar));
        store
            .saveEvent_span_error(&ek, EKSpan::ThisEvent)
            .map_err(|e| e.localizedDescription().to_string())?;
        Ok(ek.eventIdentifier().map(|s| s.to_string()).unwrap_or_default())
    }
}
