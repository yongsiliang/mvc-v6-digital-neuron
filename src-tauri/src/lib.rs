// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use enigo::{Enigo, Key, Keyboard, Mouse, MouseButton, MouseControllable};
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 截图结果
#[derive(Serialize)]
struct ScreenshotResult {
    success: bool,
    base64: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    error: Option<String>,
}

/// 鼠标位置
#[derive(Serialize)]
struct MousePosition {
    x: i32,
    y: i32,
}

/// 操作结果
#[derive(Serialize)]
struct OperationResult {
    success: bool,
    message: String,
}

/// 键盘按键映射
fn get_key(key_name: &str) -> Option<Key> {
    let key_map: HashMap<&str, Key> = [
        ("enter", Key::Return),
        ("return", Key::Return),
        ("tab", Key::Tab),
        ("escape", Key::Escape),
        ("esc", Key::Escape),
        ("backspace", Key::Backspace),
        ("delete", Key::Delete),
        ("insert", Key::Insert),
        ("home", Key::Home),
        ("end", Key::End),
        ("pageup", Key::PageUp),
        ("pagedown", Key::PageDown),
        ("capslock", Key::CapsLock),
        ("space", Key::Space),
        ("arrowup", Key::UpArrow),
        ("up", Key::UpArrow),
        ("arrowdown", Key::DownArrow),
        ("down", Key::DownArrow),
        ("arrowleft", Key::LeftArrow),
        ("left", Key::LeftArrow),
        ("arrowright", Key::RightArrow),
        ("right", Key::RightArrow),
        ("f1", Key::F1),
        ("f2", Key::F2),
        ("f3", Key::F3),
        ("f4", Key::F4),
        ("f5", Key::F5),
        ("f6", Key::F6),
        ("f7", Key::F7),
        ("f8", Key::F8),
        ("f9", Key::F9),
        ("f10", Key::F10),
        ("f11", Key::F11),
        ("f12", Key::F12),
    ]
    .iter()
    .cloned()
    .collect();

    key_map.get(key_name.to_lowercase().as_str()).copied()
}

/// 截图命令
#[tauri::command]
fn screenshot() -> ScreenshotResult {
    let screen = match Screen::all() {
        Ok(screens) => {
            if screens.is_empty() {
                return ScreenshotResult {
                    success: false,
                    base64: None,
                    width: None,
                    height: None,
                    error: Some("没有找到显示器".to_string()),
                };
            }
            screens.into_iter().next().unwrap()
        }
        Err(e) => {
            return ScreenshotResult {
                success: false,
                base64: None,
                width: None,
                height: None,
                error: Some(format!("获取显示器失败: {}", e)),
            }
        }
    };

    // 获取显示器信息
    let width = screen.display_info.width;
    let height = screen.display_info.height;

    // 截图
    let image = match screen.capture() {
        Ok(img) => img,
        Err(e) => {
            return ScreenshotResult {
                success: false,
                base64: None,
                width: None,
                height: None,
                error: Some(format!("截图失败: {}", e)),
            }
        }
    };

    // 转换为 base64
    let buffer = image.to_png();
    let base64_string = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &buffer);

    ScreenshotResult {
        success: true,
        base64: Some(base64_string),
        width: Some(width),
        height: Some(height),
        error: None,
    }
}

/// 鼠标移动
#[tauri::command]
fn mouse_move(x: i32, y: i32) -> OperationResult {
    let mut enigo = Enigo::new();
    enigo.mouse_move_to(x, y);
    OperationResult {
        success: true,
        message: format!("鼠标移动到 ({}, {})", x, y),
    }
}

/// 鼠标点击
#[tauri::command]
fn mouse_click(button: String) -> OperationResult {
    let mut enigo = Enigo::new();
    let btn = match button.to_lowercase().as_str() {
        "left" => MouseButton::Left,
        "right" => MouseButton::Right,
        "middle" => MouseButton::Middle,
        _ => MouseButton::Left,
    };
    enigo.mouse_click(btn);
    OperationResult {
        success: true,
        message: format!("鼠标{}键点击", button),
    }
}

/// 鼠标双击
#[tauri::command]
fn mouse_double_click(button: String) -> OperationResult {
    let mut enigo = Enigo::new();
    let btn = match button.to_lowercase().as_str() {
        "left" => MouseButton::Left,
        "right" => MouseButton::Right,
        "middle" => MouseButton::Middle,
        _ => MouseButton::Left,
    };
    enigo.mouse_click(btn);
    enigo.mouse_click(btn);
    OperationResult {
        success: true,
        message: format!("鼠标{}键双击", button),
    }
}

/// 鼠标滚动
#[tauri::command]
fn mouse_scroll(amount: i32) -> OperationResult {
    let mut enigo = Enigo::new();
    enigo.mouse_scroll_y(amount);
    OperationResult {
        success: true,
        message: format!("鼠标滚动 {}", amount),
    }
}

/// 获取鼠标位置
#[tauri::command]
fn mouse_position() -> MousePosition {
    let enigo = Enigo::new();
    let (x, y) = enigo.mouse_location();
    MousePosition { x, y }
}

/// 键盘输入文本
#[tauri::command]
fn keyboard_type(text: String) -> OperationResult {
    let mut enigo = Enigo::new();
    match enigo.text(&text) {
        Ok(()) => OperationResult {
            success: true,
            message: format!("输入文本: {}", text),
        },
        Err(e) => OperationResult {
            success: false,
            message: format!("输入失败: {:?}", e),
        },
    }
}

/// 键盘按键
#[tauri::command]
fn keyboard_press(key: String) -> OperationResult {
    let mut enigo = Enigo::new();

    let key_name = key.to_lowercase();

    // 特殊键
    if let Some(k) = get_key(&key_name) {
        enigo.key_click(k);
        return OperationResult {
            success: true,
            message: format!("按下 {} 键", key),
        };
    }

    // 单字符
    if key_name.len() == 1 {
        if let Some(c) = key_name.chars().next() {
            enigo.key_click(Key::Unicode(c));
            return OperationResult {
                success: true,
                message: format!("按下 {} 键", c),
            };
        }
    }

    // Ctrl/Alt/Shift 组合键
    if key_name.starts_with("ctrl+") || key_name.starts_with("alt+") || key_name.starts_with("shift+") {
        let parts: Vec<&str> = key_name.split('+').collect();
        if parts.len() == 2 {
            let modifier = parts[0];
            let target_key = parts[1];

            if let Some(k) = get_key(target_key) {
                match modifier {
                    "ctrl" => enigo.key_down(Key::Control),
                    "alt" => enigo.key_down(Key::Alt),
                    "shift" => enigo.key_down(Key::Shift),
                    _ => Key::Control,
                };
                enigo.key_click(k);
                match modifier {
                    "ctrl" => enigo.key_up(Key::Control),
                    "alt" => enigo.key_up(Key::Alt),
                    "shift" => enigo.key_up(Key::Shift),
                    _ => Key::Control,
                };
                return OperationResult {
                    success: true,
                    message: format!("按下 {} 组合键", key),
                };
            }
        }
    }

    OperationResult {
        success: false,
        message: format!("未知按键: {}", key),
    }
}

/// 键盘按下
#[tauri::command]
fn keyboard_key_down(key: String) -> OperationResult {
    let mut enigo = Enigo::new();
    let key_name = key.to_lowercase();

    if let Some(k) = get_key(&key_name) {
        enigo.key_down(k);
        return OperationResult {
            success: true,
            message: format!("按下 {} 键", key),
        };
    }

    OperationResult {
        success: false,
        message: format!("未知按键: {}", key),
    }
}

/// 键盘释放
#[tauri::command]
fn keyboard_key_up(key: String) -> OperationResult {
    let mut enigo = Enigo::new();
    let key_name = key.to_lowercase();

    if let Some(k) = get_key(&key_name) {
        enigo.key_up(k);
        return OperationResult {
            success: true,
            message: format!("释放 {} 键", key),
        };
    }

    OperationResult {
        success: false,
        message: format!("未知按键: {}", key),
    }
}

// Tauri v2 配置
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            screenshot,
            mouse_move,
            mouse_click,
            mouse_double_click,
            mouse_scroll,
            mouse_position,
            keyboard_type,
            keyboard_press,
            keyboard_key_down,
            keyboard_key_up,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
