//! ZOE - Where Programs Live
//!
//! Pantheon web interface daemon.
//! Port 9601. Pure Rust. axum.
//!
//! phi = 1.6180339887

use axum::{
    Router,
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::{HeaderValue, Method, StatusCode},
    response::{Html, IntoResponse, Json},
    routing::{get, post},
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc, time::Instant};
use tokio::sync::broadcast;
use tower_http::{
    cors::CorsLayer,
    services::ServeDir,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHI: f64 = 1.6180339887;
const PORT: u16 = 9601;

/// All six Pantheon daemon ports.
const PANTHEON_DAEMONS: &[DaemonDef] = &[
    DaemonDef { name: "cipher",  port: 9500 },
    DaemonDef { name: "leonardo", port: 9600 },
    DaemonDef { name: "zoe",     port: 9601 },
    DaemonDef { name: "euterpe", port: 9602 },
    DaemonDef { name: "ear",     port: 9700 },
    DaemonDef { name: "nyx",     port: 9999 },
];

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

struct AppState {
    start_time: Instant,
    http: reqwest::Client,
    ws_tx: broadcast::Sender<String>,
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

struct DaemonDef {
    name: &'static str,
    port: u16,
}

#[derive(Serialize, Clone)]
struct DaemonStatus {
    name: String,
    port: u16,
    status: String,  // "up" | "down" | "timeout"
    data: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    name: &'static str,
    port: u16,
    uptime: u64,
    phi: f64,
}

#[derive(Serialize)]
struct StatusResponse {
    uptime: u64,
    name: &'static str,
    port: u16,
    version: &'static str,
    phi: f64,
}

#[derive(Serialize)]
struct PantheonResponse {
    pantheon: Vec<DaemonStatus>,
    summary: PantheonSummary,
    timestamp: u128,
}

#[derive(Serialize)]
struct PantheonSummary {
    total: usize,
    alive: usize,
    down: usize,
}

#[derive(Deserialize)]
struct ChatRequest {
    message: String,
}

#[derive(Serialize)]
struct ChatErrorResponse {
    error: String,
    port: u16,
}

// ---------------------------------------------------------------------------
// Daemon health probe
// ---------------------------------------------------------------------------

async fn probe_daemon(client: &reqwest::Client, def: &DaemonDef) -> DaemonStatus {
    let url = format!("http://localhost:{}/health", def.port);
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(2),
        client.get(&url).send(),
    )
    .await;

    match result {
        Ok(Ok(resp)) => {
            let data = resp.json::<serde_json::Value>().await.ok();
            DaemonStatus {
                name: def.name.to_string(),
                port: def.port,
                status: "up".to_string(),
                data,
            }
        }
        Ok(Err(_)) => DaemonStatus {
            name: def.name.to_string(),
            port: def.port,
            status: "down".to_string(),
            data: None,
        },
        Err(_) => DaemonStatus {
            name: def.name.to_string(),
            port: def.port,
            status: "timeout".to_string(),
            data: None,
        },
    }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/// GET /health
async fn health(State(state): State<Arc<AppState>>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "alive",
        name: "zoe",
        port: PORT,
        uptime: state.start_time.elapsed().as_secs(),
        phi: PHI,
    })
}

/// GET /status
async fn status(State(state): State<Arc<AppState>>) -> Json<StatusResponse> {
    Json(StatusResponse {
        uptime: state.start_time.elapsed().as_secs(),
        name: "zoe",
        port: PORT,
        version: "3.0.0",
        phi: PHI,
    })
}

/// GET /api/pantheon -- aggregate daemon health
async fn api_pantheon(State(state): State<Arc<AppState>>) -> Json<PantheonResponse> {
    let futures: Vec<_> = PANTHEON_DAEMONS
        .iter()
        .map(|d| probe_daemon(&state.http, d))
        .collect();

    let results = futures::future::join_all(futures).await;

    let alive = results.iter().filter(|r| r.status == "up").count();
    let total = results.len();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    Json(PantheonResponse {
        pantheon: results,
        summary: PantheonSummary {
            total,
            alive,
            down: total - alive,
        },
        timestamp: now,
    })
}

/// POST /api/chat -- proxy to cipher daemon at port 9500
async fn api_chat(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ChatRequest>,
) -> impl IntoResponse {
    let payload = serde_json::json!({ "message": body.message });

    let result = tokio::time::timeout(
        std::time::Duration::from_secs(10),
        state
            .http
            .post("http://localhost:9500/api/chat")
            .json(&payload)
            .send(),
    )
    .await;

    match result {
        Ok(Ok(resp)) => {
            let status = resp.status();
            match resp.text().await {
                Ok(text) => (
                    StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::OK),
                    [(axum::http::header::CONTENT_TYPE, "application/json")],
                    text,
                )
                    .into_response(),
                Err(_) => (
                    StatusCode::BAD_GATEWAY,
                    Json(ChatErrorResponse {
                        error: "cipher daemon read error".into(),
                        port: 9500,
                    }),
                )
                    .into_response(),
            }
        }
        Ok(Err(_)) => (
            StatusCode::BAD_GATEWAY,
            Json(ChatErrorResponse {
                error: "cipher daemon unavailable".into(),
                port: 9500,
            }),
        )
            .into_response(),
        Err(_) => (
            StatusCode::GATEWAY_TIMEOUT,
            Json(ChatErrorResponse {
                error: "cipher daemon timeout".into(),
                port: 9500,
            }),
        )
            .into_response(),
    }
}

/// GET /ws -- WebSocket handler
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state))
}

async fn handle_ws(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.ws_tx.subscribe();

    // Forward broadcast messages to this client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Receive messages from client, broadcast to all
    let tx = state.ws_tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    let _ = tx.send(text.to_string());
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }
}

/// GET / -- serve embedded dashboard HTML (fallback when static/index.html missing)
async fn dashboard() -> Html<&'static str> {
    Html(include_str!("../static/index.html"))
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

#[tokio::main]
async fn main() {
    let (ws_tx, _) = broadcast::channel::<String>(256);

    let state = Arc::new(AppState {
        start_time: Instant::now(),
        http: reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(5))
            .build()
            .expect("failed to build HTTP client"),
        ws_tx,
    });

    // CORS -- allow everything for local dev
    let cors = CorsLayer::new()
        .allow_origin("*".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(tower_http::cors::Any);

    // Static file serving from ./static/
    let static_dir = ServeDir::new("static");

    let app = Router::new()
        // API routes
        .route("/health", get(health))
        .route("/status", get(status))
        .route("/api/pantheon", get(api_pantheon))
        .route("/api/chat", post(api_chat))
        .route("/ws", get(ws_handler))
        // Dashboard at root
        .route("/", get(dashboard))
        // Static files fallback
        .fallback_service(static_dir)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], PORT));
    eprintln!("[ZOE] alive on port {PORT}");
    eprintln!("[ZOE] http://localhost:{PORT}");
    eprintln!("[ZOE] phi = {PHI}");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind");

    axum::serve(listener, app)
        .await
        .expect("server error");
}
